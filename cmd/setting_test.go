package cmd

import (
	"strings"
	"testing"
)

func TestValidPanelDomain(t *testing.T) {
	for _, domain := range []string{"panel.example.com", "panel-1.example.com", "xn--fiqs8s.example"} {
		if !validPanelDomain(domain) {
			t.Errorf("rejected valid domain %q", domain)
		}
	}
	for _, domain := range []string{"", "localhost", "https://panel.example.com", "panel.example.com:443", "panel.example.com/app", "127.0.0.1", "::1", "a..example.com", "-a.example.com", "a-.example.com", "a.example.com.", "a_example.com", strings.Repeat("a", 64) + ".com", strings.Repeat("a.", 126) + "aa"} {
		if validPanelDomain(domain) {
			t.Errorf("accepted invalid domain %q", domain)
		}
	}
}
