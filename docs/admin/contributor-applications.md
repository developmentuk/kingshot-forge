# Contributor Applications — Operations inventory

Status: **Implemented in development**.

The public catalogue is available at `/join`; applicant workflows use `/join/apply` and `/join/my-application`. The Operations surface is `/operations/applications` with server pagination, capability-gated detail and protected review actions.

The intended capability keys are `applications.read`, `applications.review`, `applications.request_information`, `applications.change_status`, `applications.assign_reviewer`, `applications.view_internal_notes`, `applications.manage_onboarding` and `applications.manage_role_catalogue`. Owner and Administrator receive these capabilities through the migration. Other roles receive none by default.
