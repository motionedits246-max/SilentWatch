use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RedactionSummary {
    pub user_paths_redacted: usize,
    pub tokens_redacted: usize,
    pub credentials_redacted: usize,
}

pub struct RedactionEngine;

fn user_path_win_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r#"(?i)[A-Z]:\\{1,2}Users\\{1,2}[^\\\s"']+"#).unwrap())
}

fn user_path_unix_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r#"/(home|Users)/[^/\s"']+"#).unwrap())
}

fn bearer_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"(?i)(Bearer\s+)[A-Za-z0-9\-_\.=+/]{8,}").unwrap())
}

fn secret_kv_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r#"(?i)(--?(?:token|api[-_]?key|password|passwd|secret|auth)\s*[=\s]\s*)([^\s"']{4,})"#)
            .unwrap()
    })
}

impl RedactionEngine {
    pub fn sanitize(input: &str) -> (String, RedactionSummary) {
        let mut summary = RedactionSummary::default();

        let step1 = user_path_win_re().replace_all(input, |_: &regex::Captures| {
            summary.user_paths_redacted += 1;
            "%USERPROFILE%"
        });

        let step2 = user_path_unix_re().replace_all(&step1, |_: &regex::Captures| {
            summary.user_paths_redacted += 1;
            "$HOME"
        });

        let step3 = bearer_re().replace_all(&step2, |caps: &regex::Captures| {
            summary.tokens_redacted += 1;
            format!("{}[REDACTED_TOKEN]", &caps[1])
        });

        let step4 = secret_kv_re().replace_all(&step3, |caps: &regex::Captures| {
            summary.credentials_redacted += 1;
            format!("{}[REDACTED_SECRET]", &caps[1])
        });

        (step4.into_owned(), summary)
    }

    pub fn sanitize_str(input: &str) -> String {
        Self::sanitize(input).0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn redacts_windows_user_paths_json_paths_and_tokens() {
        let raw = r#"C:\Users\Alex\AppData\Local\Updater\host.exe --token=ghp_1234567890abcdef -H "Bearer eyJhbGciOiJIUzI1NiJ9.abc""#;
        let (clean, summary) = RedactionEngine::sanitize(raw);
        assert!(!clean.contains("Alex"));
        assert!(!clean.contains("ghp_1234567890abcdef"));
        assert!(!clean.contains("eyJhbGciOiJIUzI1NiJ9"));
        assert!(clean.contains("%USERPROFILE%"));
        assert!(clean.contains("[REDACTED_SECRET]"));
        assert!(clean.contains("[REDACTED_TOKEN]"));
        assert_eq!(summary.user_paths_redacted, 1);

        let json_escaped = r#"{"path":"C:\\Users\\Jordan\\Desktop\\tool.exe"}"#;
        let (clean_json, s2) = RedactionEngine::sanitize(json_escaped);
        assert!(!clean_json.contains("Jordan"));
        assert_eq!(s2.user_paths_redacted, 1);
    }
}
