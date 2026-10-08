"""Exercise the installer with real archives and isolated paths, without root/network."""
import os
import pty
import re
import select
import time
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

SOURCE = (Path(__file__).resolve().parents[1] / 'install.sh').read_text()


def function(name):
    start = SOURCE.index(name + '() {')
    return SOURCE[start:SOURCE.index('\n}\n', start) + 3]


class InstallerTest(unittest.TestCase):
    def run_install(self, existing=False, failure='', domain=''):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for path in ('usr/local', 'usr/bin', 'etc/systemd/system', 'tmp'):
                (root / path).mkdir(parents=True)
            if existing:
                (root / 'usr/local/s-ui/db').mkdir(parents=True)
                (root / 'usr/local/s-ui/db/s-ui.db').write_text('existing users and settings')
                (root / 'usr/local/s-ui/sui').write_text('old binary')
            bundle = root / 'bundle/s-ui'
            bundle.mkdir(parents=True)
            (bundle / 'sui').write_text('''#!/bin/bash
printf '%s\\n' "$*" >> "$COMMAND_LOG"
if [[ "$*" == "setting -h" ]]; then echo "-domain string"; fi
[[ "$1" != migrate || "$FAILURE" != migration ]] || exit 1
''')
            (bundle / 'sui').chmod(0o755)
            (bundle / 's-ui.sh').write_text('#!/bin/bash\nexit 0\n')
            if failure != 'archive':
                (bundle / 's-ui.service').write_text('[Service]\n')
            fixture = root / 'release.tar.gz'
            with tarfile.open(fixture, 'w:gz') as archive:
                archive.add(bundle, arcname='s-ui')
            functions = '\n'.join(function(name) for name in (
                'is_auto', 'config_after_install', 'backup_existing_install', 'valid_panel_domain',
                'configure_domain_prompt', 'install_s-ui'))
            functions = re.sub(r'/(?:usr/local/|usr/bin/|etc/|var/backups/|tmp/)',
                               lambda match: str(root) + match.group(), functions)
            stubs = '''
arch() { echo amd64; }
download_release() { [[ "$FAILURE" != download ]] && cp "$FIXTURE" "$1"; }
systemctl() { echo "systemctl $*" >> "$COMMAND_LOG"; }
gen_random_string() { echo random; }
pick_port() { echo "$1"; }
resolve_port_clash() { :; }
open_firewall() { :; }
prepare_services() { :; }
sleep() { :; }
s-ui() { :; }
'''
            if failure == 'backup':
                stubs += 'backup_existing_install() { return 1; }\n'
            env = dict(os.environ, FAILURE=failure, FIXTURE=str(fixture),
                       COMMAND_LOG=str(root / 'commands.log'), SUI_AUTO='1', SUI_DOMAIN=domain)
            result = subprocess.run(['bash'], input=functions + stubs + '\nconfigure_domain_prompt && install_s-ui v1.4.2-libresui.2\n',
                                    text=True, env=env, capture_output=True)
            log = (root / 'commands.log').read_text() if (root / 'commands.log').exists() else ''
            db = root / 'usr/local/s-ui/db/s-ui.db'
            backups = list((root / 'var/backups/libresui').glob('*.tar.gz'))
            snapshot = []
            if backups:
                with tarfile.open(backups[0]) as archive:
                    snapshot = archive.getnames()
                self.assertEqual(backups[0].stat().st_mode & 0o777, 0o600)
            return result.returncode, log, db.read_text() if db.exists() else None, snapshot

    def test_fresh_install_generates_credentials_and_starts_service(self):
        code, log, _, backups = self.run_install()
        self.assertEqual(code, 0)
        self.assertIn('admin -username random -password random', log)
        self.assertIn('systemctl restart s-ui', log)
        self.assertFalse(backups)

    def test_update_backs_up_and_preserves_database_and_credentials(self):
        code, log, db, backups = self.run_install(existing=True)
        self.assertEqual(code, 0)
        self.assertEqual(db, 'existing users and settings')
        self.assertNotIn('admin -username', log)
        self.assertTrue(any(name.endswith('db/s-ui.db') for name in backups))
        self.assertLess(log.index('systemctl stop s-ui'), log.index('migrate'))

    def test_failed_download_or_invalid_archive_leaves_service_untouched(self):
        for failure in ('download', 'archive'):
            with self.subTest(failure=failure):
                code, log, db, _ = self.run_install(existing=True, failure=failure)
                self.assertNotEqual(code, 0)
                self.assertNotIn('systemctl stop', log)
                self.assertEqual(db, 'existing users and settings')

    def test_failed_backup_aborts_and_restarts_old_service(self):
        code, log, db, _ = self.run_install(existing=True, failure='backup')
        self.assertNotEqual(code, 0)
        self.assertIn('systemctl start s-ui', log)
        self.assertNotIn('migrate', log)
        self.assertEqual(db, 'existing users and settings')

    def test_terminal_prompt_retries_invalid_domain(self):
        master, slave = pty.openpty()
        env = os.environ.copy()
        env.pop('SUI_DOMAIN', None)
        script = function('valid_panel_domain') + function('configure_domain_prompt')
        script += '\nconfigure_domain_prompt && printf "SAVED=%s\\n" "$config_domain"\n'
        child = subprocess.Popen(['bash', '-c', script], stdin=slave, stdout=slave,
                                 stderr=slave, env=env)
        os.close(slave)
        os.write(master, b'https://wrong.example\nPanel.Example.COM\n')
        output = b''
        deadline = time.monotonic() + 10
        try:
            while time.monotonic() < deadline:
                if select.select([master], [], [], 0.1)[0]:
                    try:
                        chunk = os.read(master, 4096)
                    except OSError:
                        break
                    if not chunk:
                        break
                    output += chunk
            self.assertEqual(child.wait(timeout=1), 0)
        finally:
            if child.poll() is None:
                child.kill()
                child.wait()
            os.close(master)
        self.assertIn(b'Enter a domain name only', output)
        self.assertIn(b'SAVED=panel.example.com', output)
        self.assertEqual(output.count(b'Panel domain (e.g.'), 2)

    def test_domain_is_normalized_and_saved_before_start(self):
        code, log, _, _ = self.run_install(domain='Panel.Example.COM')
        self.assertEqual(code, 0)
        self.assertIn('setting -domain panel.example.com', log)
        self.assertLess(log.index('setting -domain'), log.index('systemctl restart'))

    def test_skipped_domain_does_not_change_existing_domain(self):
        code, log, _, _ = self.run_install(existing=True)
        self.assertEqual(code, 0)
        self.assertNotIn('setting -domain', log)

    def test_invalid_domain_aborts_before_download_or_service_stop(self):
        for domain in ('https://panel.example.com', '127.0.0.1', 'panel.example.com:443',
                       '-panel.example.com', 'panel..example.com', 'panel.example.com.'):
            with self.subTest(domain=domain):
                code, log, db, backups = self.run_install(existing=True, domain=domain)
                self.assertNotEqual(code, 0)
                self.assertEqual(log, '')
                self.assertFalse(backups)
                self.assertEqual(db, 'existing users and settings')

    def test_failed_migration_does_not_start_new_service(self):
        code, log, _, backups = self.run_install(existing=True, failure='migration')
        self.assertNotEqual(code, 0)
        self.assertNotIn('systemctl restart s-ui', log)
        self.assertTrue(backups)


if __name__ == '__main__':
    unittest.main()
