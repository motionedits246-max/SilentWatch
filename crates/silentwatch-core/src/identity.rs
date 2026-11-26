use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fmt;

/// Stable process-instance identity that prevents Windows PID reuse collisions.
/// Combines the boot/session context, OS PID, and process creation timestamp.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct ProcessInstanceId {
    pub boot_id: String,
    pub pid: u32,
    pub start_time_ms: i64,
}

impl ProcessInstanceId {
    pub fn new(boot_id: impl Into<String>, pid: u32, start_time_ms: i64) -> Self {
        Self {
            boot_id: boot_id.into(),
            pid,
            start_time_ms,
        }
    }

    pub fn stable_key(&self) -> String {
        format!("{}:{}:{}", self.boot_id, self.pid, self.start_time_ms)
    }

    pub fn short_hash(&self) -> String {
        let mut hasher = Sha256::new();
        hasher.update(self.stable_key().as_bytes());
        let digest = hasher.finalize();
        hex::encode(&digest[..6])
    }
}

impl fmt::Display for ProcessInstanceId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}:{}", self.boot_id, self.pid, self.start_time_ms)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pid_reuse_produces_distinct_identities() {
        let first = ProcessInstanceId::new("boot_9f2a", 4812, 1_732_611_728_412);
        let reused = ProcessInstanceId::new("boot_9f2a", 4812, 1_732_611_999_100);
        assert_ne!(first, reused);
        assert_ne!(first.stable_key(), reused.stable_key());
        assert_ne!(first.short_hash(), reused.short_hash());
    }

    #[test]
    fn reboot_with_same_pid_produces_distinct_identities() {
        let boot1 = ProcessInstanceId::new("boot_1111", 1044, 1_732_611_000_000);
        let boot2 = ProcessInstanceId::new("boot_2222", 1044, 1_732_611_000_000);
        assert_ne!(boot1, boot2);
        assert_ne!(boot1.short_hash(), boot2.short_hash());
    }
}
