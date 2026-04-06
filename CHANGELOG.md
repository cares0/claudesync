# Changelog

## [0.5.0](https://github.com/cares0/claudesync/compare/claude-settings-sync-v0.4.1...claude-settings-sync-v0.5.0) (2026-04-06)


### Features

* add auto sync feature with OS native scheduler ([38bb5aa](https://github.com/cares0/claudesync/commit/38bb5aaa8dd418696b98eff13550dbeced9405af))
* add postinstall banner script ([6f1c85b](https://github.com/cares0/claudesync/commit/6f1c85b595fd1aebd76a93ecca28689fe54b8998))
* add postinstall script and include scripts/ in package files ([d268ac0](https://github.com/cares0/claudesync/commit/d268ac02551deabce60a27a442699d755b95a4df))
* **auto:** add auto disable command ([f1e6e59](https://github.com/cares0/claudesync/commit/f1e6e5907941320408d276a641d0537eb46c249b))
* **auto:** add auto status command with log display ([161eca4](https://github.com/cares0/claudesync/commit/161eca47829ee4a906df9b6d3b6acceeeeaa69c8))
* **auto:** add auto sync config persistence ([bee1d09](https://github.com/cares0/claudesync/commit/bee1d0977c510cbd242f01bea3b5b406ce497212))
* **auto:** add auto sync log recording and reading ([1e53d6f](https://github.com/cares0/claudesync/commit/1e53d6f648f8a282d593864d755f49914bf0a50d))
* **auto:** add AutoConfig and PullConflictPolicy types ([5a4b10a](https://github.com/cares0/claudesync/commit/5a4b10ac113e89f1cd44c09bca5723f9e07edc17))
* **auto:** add i18n messages for auto sync feature ([b80cbe5](https://github.com/cares0/claudesync/commit/b80cbe5e50c7344fc1542aafc4197df4e2654bbf))
* **auto:** add interactive auto sync setup command ([c0e66ad](https://github.com/cares0/claudesync/commit/c0e66adbc27d569b67d319ba9f8ff92b3f9cb67d))
* **auto:** add lock file management for concurrent sync prevention ([d6d885f](https://github.com/cares0/claudesync/commit/d6d885ff9f71ee45d995f2763d76a540855ced59))
* **auto:** add non-interactive auto-run command for scheduler execution ([1df9c27](https://github.com/cares0/claudesync/commit/1df9c27f11c87c230712e92bd9aff619402e298e))
* **auto:** add OS native notification and pending notification system ([a5e9368](https://github.com/cares0/claudesync/commit/a5e936862832140561fc7492dad18a11d8f6f0ab))
* **auto:** add OS native scheduler (launchd, systemd, schtasks) ([813964e](https://github.com/cares0/claudesync/commit/813964e5801c40a63987de46dd0f23913ad3a87b))
* **auto:** add path utilities for auto sync config, log, lock, notifications ([943e6b6](https://github.com/cares0/claudesync/commit/943e6b6394731377fb4b35be4cfa0e72113d79c1))
* **auto:** add primary_device support to SyncMeta and Gist API ([fd26ce3](https://github.com/cares0/claudesync/commit/fd26ce3462979c4ecbefcacf19bcf76c508d955e))
* **auto:** use UUID-based machine ID for primary device identification ([f9de248](https://github.com/cares0/claudesync/commit/f9de248e15336ee73161296bbf9e653733b5cb01))
* **auto:** wire auto commands into CLI with pending notification display ([18c994c](https://github.com/cares0/claudesync/commit/18c994c25436ccec2e1207c925b546ab1a912c38))
* **i18n:** add config command and language priority system ([c2b80e4](https://github.com/cares0/claudesync/commit/c2b80e4554819585159ecac74ddc4a8ecb39ff96))
* **i18n:** complete i18n for all CLI messages with persistent config ([c629dee](https://github.com/cares0/claudesync/commit/c629dee498eef403df280d1665af9a39b263475f))
* **i18n:** localize auto commands, core modules, and set default lang to English ([302cc62](https://github.com/cares0/claudesync/commit/302cc62e0b7a3da1fa2a2278d8e5b3fd8746ed1c))
* **i18n:** localize help text, CLI strings, and terminal prompt ([448e7b2](https://github.com/cares0/claudesync/commit/448e7b25e1aeebaf2bfa1785c475169899d7ef46))
* **i18n:** localize init, push, pull, diff commands ([50d2214](https://github.com/cares0/claudesync/commit/50d2214c7163106e04dca2587e4438a322217e3b))
* **i18n:** localize status, history, rollback commands ([ced262f](https://github.com/cares0/claudesync/commit/ced262f985e999aa4b559820220ae0e549508c62))
* implement claudesync CLI for syncing Claude Code settings via GitHub Gist ([d805bce](https://github.com/cares0/claudesync/commit/d805bcee8729e27e3b16b7cefd49c7d745c677a0))


### Bug Fixes

* **i18n:** address review findings — localize remaining hardcoded strings ([66991fb](https://github.com/cares0/claudesync/commit/66991fb3e20c08ac467d73957961e86fad186360))
* **notify:** prevent shell injection in OS notifications ([b308c88](https://github.com/cares0/claudesync/commit/b308c885424e0bd70166c892328cbc1fb1b685df))
* read version from package.json and output banner to stdout ([ae951f3](https://github.com/cares0/claudesync/commit/ae951f3fc275aee84ee7f47dab93cb8ec0360950))
* rename npm package to claude-settings-sync ([8656bcb](https://github.com/cares0/claudesync/commit/8656bcbb63f90b1cc01a40d9d772a4740e5fe31c))
* **scheduler:** use args array instead of single string for CLI path ([bf0b437](https://github.com/cares0/claudesync/commit/bf0b43772428c8233e03d2c95c6a71588a8b04eb))
* strip ANSI codes from right argument in pad() for correct alignment ([13534a6](https://github.com/cares0/claudesync/commit/13534a67e723fd12427ea0b3894adc4249c55080))


### Documentation

* overhaul README.md/README.ko.md with full feature coverage ([cf1a20f](https://github.com/cares0/claudesync/commit/cf1a20fcd47b2e942df5f23d1e50ba1b751a4e45))
* update npm package name in README badges and install commands ([caa2ba7](https://github.com/cares0/claudesync/commit/caa2ba7274252bbe87e367883cc7d58676a23345))


### Miscellaneous

* add CLAUDE.md and docs/ to .gitignore ([3cc674c](https://github.com/cares0/claudesync/commit/3cc674c8f5b5d1d60617608e37eaa17514e0d6a8))
* add release-please and npm publish automation ([03e5623](https://github.com/cares0/claudesync/commit/03e5623c091a0ccba3d5c39a187a6581a1464c64))
* **main:** release claude-settings-sync 0.3.0 ([961152d](https://github.com/cares0/claudesync/commit/961152d44e6d6931da9b34bbab0dec399937d76c))
* **main:** release claude-settings-sync 0.3.0 ([6c6f389](https://github.com/cares0/claudesync/commit/6c6f389267ccaf1d684a257b75a2758b025f99e5))
* **main:** release claude-settings-sync 0.4.0 ([d9e732e](https://github.com/cares0/claudesync/commit/d9e732e3c9ae5c7095831f7cac38898b86413038))
* **main:** release claude-settings-sync 0.4.0 ([b13a8a3](https://github.com/cares0/claudesync/commit/b13a8a302cd621469e2a40e14af76f6135caec5f))
* **main:** release claude-settings-sync 0.4.1 ([45464f6](https://github.com/cares0/claudesync/commit/45464f6b1a518b700f1ea7ca1d2e3fe27220549d))
* **main:** release claude-settings-sync 0.4.1 ([6f22098](https://github.com/cares0/claudesync/commit/6f220982599970c076b973a20a1425ceb40d47ce))
* **main:** release claudesync 0.2.0 ([1c673f8](https://github.com/cares0/claudesync/commit/1c673f861d522f60bb47c90d7b7459e27cbcc601))
* **main:** release claudesync 0.2.0 ([d148aaa](https://github.com/cares0/claudesync/commit/d148aaa3a07ce6be8abab4c7105b4cb99b37c0e9))
* remove unused imports in auto.ts ([ccc96ca](https://github.com/cares0/claudesync/commit/ccc96ca7bc6733018aa2475255b26d5b51d6c59a))

## [0.4.1](https://github.com/cares0/claudesync/compare/claude-settings-sync-v0.4.0...claude-settings-sync-v0.4.1) (2026-04-06)


### Bug Fixes

* read version from package.json and output banner to stdout ([ae951f3](https://github.com/cares0/claudesync/commit/ae951f3fc275aee84ee7f47dab93cb8ec0360950))

## [0.4.0](https://github.com/cares0/claudesync/compare/claude-settings-sync-v0.3.0...claude-settings-sync-v0.4.0) (2026-04-04)


### Features

* add postinstall banner script ([6f1c85b](https://github.com/cares0/claudesync/commit/6f1c85b595fd1aebd76a93ecca28689fe54b8998))
* add postinstall script and include scripts/ in package files ([d268ac0](https://github.com/cares0/claudesync/commit/d268ac02551deabce60a27a442699d755b95a4df))


### Bug Fixes

* strip ANSI codes from right argument in pad() for correct alignment ([13534a6](https://github.com/cares0/claudesync/commit/13534a67e723fd12427ea0b3894adc4249c55080))


### Documentation

* update npm package name in README badges and install commands ([caa2ba7](https://github.com/cares0/claudesync/commit/caa2ba7274252bbe87e367883cc7d58676a23345))

## [0.3.0](https://github.com/cares0/claudesync/compare/claude-settings-sync-v0.2.0...claude-settings-sync-v0.3.0) (2026-04-04)


### Features

* add auto sync feature with OS native scheduler ([38bb5aa](https://github.com/cares0/claudesync/commit/38bb5aaa8dd418696b98eff13550dbeced9405af))
* **auto:** add auto disable command ([f1e6e59](https://github.com/cares0/claudesync/commit/f1e6e5907941320408d276a641d0537eb46c249b))
* **auto:** add auto status command with log display ([161eca4](https://github.com/cares0/claudesync/commit/161eca47829ee4a906df9b6d3b6acceeeeaa69c8))
* **auto:** add auto sync config persistence ([bee1d09](https://github.com/cares0/claudesync/commit/bee1d0977c510cbd242f01bea3b5b406ce497212))
* **auto:** add auto sync log recording and reading ([1e53d6f](https://github.com/cares0/claudesync/commit/1e53d6f648f8a282d593864d755f49914bf0a50d))
* **auto:** add AutoConfig and PullConflictPolicy types ([5a4b10a](https://github.com/cares0/claudesync/commit/5a4b10ac113e89f1cd44c09bca5723f9e07edc17))
* **auto:** add i18n messages for auto sync feature ([b80cbe5](https://github.com/cares0/claudesync/commit/b80cbe5e50c7344fc1542aafc4197df4e2654bbf))
* **auto:** add interactive auto sync setup command ([c0e66ad](https://github.com/cares0/claudesync/commit/c0e66adbc27d569b67d319ba9f8ff92b3f9cb67d))
* **auto:** add lock file management for concurrent sync prevention ([d6d885f](https://github.com/cares0/claudesync/commit/d6d885ff9f71ee45d995f2763d76a540855ced59))
* **auto:** add non-interactive auto-run command for scheduler execution ([1df9c27](https://github.com/cares0/claudesync/commit/1df9c27f11c87c230712e92bd9aff619402e298e))
* **auto:** add OS native notification and pending notification system ([a5e9368](https://github.com/cares0/claudesync/commit/a5e936862832140561fc7492dad18a11d8f6f0ab))
* **auto:** add OS native scheduler (launchd, systemd, schtasks) ([813964e](https://github.com/cares0/claudesync/commit/813964e5801c40a63987de46dd0f23913ad3a87b))
* **auto:** add path utilities for auto sync config, log, lock, notifications ([943e6b6](https://github.com/cares0/claudesync/commit/943e6b6394731377fb4b35be4cfa0e72113d79c1))
* **auto:** add primary_device support to SyncMeta and Gist API ([fd26ce3](https://github.com/cares0/claudesync/commit/fd26ce3462979c4ecbefcacf19bcf76c508d955e))
* **auto:** use UUID-based machine ID for primary device identification ([f9de248](https://github.com/cares0/claudesync/commit/f9de248e15336ee73161296bbf9e653733b5cb01))
* **auto:** wire auto commands into CLI with pending notification display ([18c994c](https://github.com/cares0/claudesync/commit/18c994c25436ccec2e1207c925b546ab1a912c38))
* **i18n:** add config command and language priority system ([c2b80e4](https://github.com/cares0/claudesync/commit/c2b80e4554819585159ecac74ddc4a8ecb39ff96))
* **i18n:** complete i18n for all CLI messages with persistent config ([c629dee](https://github.com/cares0/claudesync/commit/c629dee498eef403df280d1665af9a39b263475f))
* **i18n:** localize auto commands, core modules, and set default lang to English ([302cc62](https://github.com/cares0/claudesync/commit/302cc62e0b7a3da1fa2a2278d8e5b3fd8746ed1c))
* **i18n:** localize help text, CLI strings, and terminal prompt ([448e7b2](https://github.com/cares0/claudesync/commit/448e7b25e1aeebaf2bfa1785c475169899d7ef46))
* **i18n:** localize init, push, pull, diff commands ([50d2214](https://github.com/cares0/claudesync/commit/50d2214c7163106e04dca2587e4438a322217e3b))
* **i18n:** localize status, history, rollback commands ([ced262f](https://github.com/cares0/claudesync/commit/ced262f985e999aa4b559820220ae0e549508c62))
* implement claudesync CLI for syncing Claude Code settings via GitHub Gist ([d805bce](https://github.com/cares0/claudesync/commit/d805bcee8729e27e3b16b7cefd49c7d745c677a0))


### Bug Fixes

* **i18n:** address review findings — localize remaining hardcoded strings ([66991fb](https://github.com/cares0/claudesync/commit/66991fb3e20c08ac467d73957961e86fad186360))
* **notify:** prevent shell injection in OS notifications ([b308c88](https://github.com/cares0/claudesync/commit/b308c885424e0bd70166c892328cbc1fb1b685df))
* rename npm package to claude-settings-sync ([8656bcb](https://github.com/cares0/claudesync/commit/8656bcbb63f90b1cc01a40d9d772a4740e5fe31c))
* **scheduler:** use args array instead of single string for CLI path ([bf0b437](https://github.com/cares0/claudesync/commit/bf0b43772428c8233e03d2c95c6a71588a8b04eb))


### Documentation

* overhaul README.md/README.ko.md with full feature coverage ([cf1a20f](https://github.com/cares0/claudesync/commit/cf1a20fcd47b2e942df5f23d1e50ba1b751a4e45))


### Miscellaneous

* add CLAUDE.md and docs/ to .gitignore ([3cc674c](https://github.com/cares0/claudesync/commit/3cc674c8f5b5d1d60617608e37eaa17514e0d6a8))
* add release-please and npm publish automation ([03e5623](https://github.com/cares0/claudesync/commit/03e5623c091a0ccba3d5c39a187a6581a1464c64))
* **main:** release claudesync 0.2.0 ([1c673f8](https://github.com/cares0/claudesync/commit/1c673f861d522f60bb47c90d7b7459e27cbcc601))
* **main:** release claudesync 0.2.0 ([d148aaa](https://github.com/cares0/claudesync/commit/d148aaa3a07ce6be8abab4c7105b4cb99b37c0e9))
* remove unused imports in auto.ts ([ccc96ca](https://github.com/cares0/claudesync/commit/ccc96ca7bc6733018aa2475255b26d5b51d6c59a))

## [0.2.0](https://github.com/cares0/claudesync/compare/claudesync-v0.1.0...claudesync-v0.2.0) (2026-04-04)


### Features

* add auto sync feature with OS native scheduler ([38bb5aa](https://github.com/cares0/claudesync/commit/38bb5aaa8dd418696b98eff13550dbeced9405af))
* **auto:** add auto disable command ([f1e6e59](https://github.com/cares0/claudesync/commit/f1e6e5907941320408d276a641d0537eb46c249b))
* **auto:** add auto status command with log display ([161eca4](https://github.com/cares0/claudesync/commit/161eca47829ee4a906df9b6d3b6acceeeeaa69c8))
* **auto:** add auto sync config persistence ([bee1d09](https://github.com/cares0/claudesync/commit/bee1d0977c510cbd242f01bea3b5b406ce497212))
* **auto:** add auto sync log recording and reading ([1e53d6f](https://github.com/cares0/claudesync/commit/1e53d6f648f8a282d593864d755f49914bf0a50d))
* **auto:** add AutoConfig and PullConflictPolicy types ([5a4b10a](https://github.com/cares0/claudesync/commit/5a4b10ac113e89f1cd44c09bca5723f9e07edc17))
* **auto:** add i18n messages for auto sync feature ([b80cbe5](https://github.com/cares0/claudesync/commit/b80cbe5e50c7344fc1542aafc4197df4e2654bbf))
* **auto:** add interactive auto sync setup command ([c0e66ad](https://github.com/cares0/claudesync/commit/c0e66adbc27d569b67d319ba9f8ff92b3f9cb67d))
* **auto:** add lock file management for concurrent sync prevention ([d6d885f](https://github.com/cares0/claudesync/commit/d6d885ff9f71ee45d995f2763d76a540855ced59))
* **auto:** add non-interactive auto-run command for scheduler execution ([1df9c27](https://github.com/cares0/claudesync/commit/1df9c27f11c87c230712e92bd9aff619402e298e))
* **auto:** add OS native notification and pending notification system ([a5e9368](https://github.com/cares0/claudesync/commit/a5e936862832140561fc7492dad18a11d8f6f0ab))
* **auto:** add OS native scheduler (launchd, systemd, schtasks) ([813964e](https://github.com/cares0/claudesync/commit/813964e5801c40a63987de46dd0f23913ad3a87b))
* **auto:** add path utilities for auto sync config, log, lock, notifications ([943e6b6](https://github.com/cares0/claudesync/commit/943e6b6394731377fb4b35be4cfa0e72113d79c1))
* **auto:** add primary_device support to SyncMeta and Gist API ([fd26ce3](https://github.com/cares0/claudesync/commit/fd26ce3462979c4ecbefcacf19bcf76c508d955e))
* **auto:** use UUID-based machine ID for primary device identification ([f9de248](https://github.com/cares0/claudesync/commit/f9de248e15336ee73161296bbf9e653733b5cb01))
* **auto:** wire auto commands into CLI with pending notification display ([18c994c](https://github.com/cares0/claudesync/commit/18c994c25436ccec2e1207c925b546ab1a912c38))
* **i18n:** add config command and language priority system ([c2b80e4](https://github.com/cares0/claudesync/commit/c2b80e4554819585159ecac74ddc4a8ecb39ff96))
* **i18n:** complete i18n for all CLI messages with persistent config ([c629dee](https://github.com/cares0/claudesync/commit/c629dee498eef403df280d1665af9a39b263475f))
* **i18n:** localize auto commands, core modules, and set default lang to English ([302cc62](https://github.com/cares0/claudesync/commit/302cc62e0b7a3da1fa2a2278d8e5b3fd8746ed1c))
* **i18n:** localize help text, CLI strings, and terminal prompt ([448e7b2](https://github.com/cares0/claudesync/commit/448e7b25e1aeebaf2bfa1785c475169899d7ef46))
* **i18n:** localize init, push, pull, diff commands ([50d2214](https://github.com/cares0/claudesync/commit/50d2214c7163106e04dca2587e4438a322217e3b))
* **i18n:** localize status, history, rollback commands ([ced262f](https://github.com/cares0/claudesync/commit/ced262f985e999aa4b559820220ae0e549508c62))
* implement claudesync CLI for syncing Claude Code settings via GitHub Gist ([d805bce](https://github.com/cares0/claudesync/commit/d805bcee8729e27e3b16b7cefd49c7d745c677a0))


### Bug Fixes

* **i18n:** address review findings — localize remaining hardcoded strings ([66991fb](https://github.com/cares0/claudesync/commit/66991fb3e20c08ac467d73957961e86fad186360))
* **notify:** prevent shell injection in OS notifications ([b308c88](https://github.com/cares0/claudesync/commit/b308c885424e0bd70166c892328cbc1fb1b685df))
* **scheduler:** use args array instead of single string for CLI path ([bf0b437](https://github.com/cares0/claudesync/commit/bf0b43772428c8233e03d2c95c6a71588a8b04eb))


### Documentation

* overhaul README.md/README.ko.md with full feature coverage ([cf1a20f](https://github.com/cares0/claudesync/commit/cf1a20fcd47b2e942df5f23d1e50ba1b751a4e45))


### Miscellaneous

* add CLAUDE.md and docs/ to .gitignore ([3cc674c](https://github.com/cares0/claudesync/commit/3cc674c8f5b5d1d60617608e37eaa17514e0d6a8))
* add release-please and npm publish automation ([03e5623](https://github.com/cares0/claudesync/commit/03e5623c091a0ccba3d5c39a187a6581a1464c64))
* remove unused imports in auto.ts ([ccc96ca](https://github.com/cares0/claudesync/commit/ccc96ca7bc6733018aa2475255b26d5b51d6c59a))
