use crate::model::{DataSourceMode, PrivilegeMode};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MotionTier {
    Full,
    Balanced,
    Off,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CloseWindowBehavior {
    HideToTray,
    MinimizeToTaskbar,
    StopAndQuit,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutConfig {
    pub command_palette: String,
    pub export_report: String,
    pub toggle_monitoring: String,
}

impl Default for ShortcutConfig {
    fn default() -> Self {
        Self {
            command_palette: "Ctrl+K".to_string(),
            export_report: "Ctrl+E".to_string(),
            toggle_monitoring: "Ctrl+Shift+M".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub onboarding_completed: bool,
    pub privilege_mode: PrivilegeMode,
    pub data_source_mode: DataSourceMode,
    pub motion_tier: MotionTier,
    pub ring_buffer_cap_mb: u64,
    pub retention_hours: u64,
    pub close_behavior: CloseWindowBehavior,
    pub start_minimized_to_tray: bool,
    pub collect_command_line_sanitized: bool,
    pub collect_module_snapshots: bool,
    pub shortcuts: ShortcutConfig,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            onboarding_completed: false,
            privilege_mode: PrivilegeMode::StandardPerUser,
            data_source_mode: DataSourceMode::Live,
            motion_tier: MotionTier::Full,
            ring_buffer_cap_mb: 512,
            retention_hours: 24,
            close_behavior: CloseWindowBehavior::HideToTray,
            start_minimized_to_tray: false,
            collect_command_line_sanitized: true,
            collect_module_snapshots: true,
            shortcuts: ShortcutConfig::default(),
        }
    }
}
