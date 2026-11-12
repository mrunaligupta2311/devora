# Devora Operations

## Health checks

- Liveness: GET /api/health
- Readiness: GET /api/health/ready

Liveness confirms that the API process is responding.
Readiness confirms that the API can reach PostgreSQL.

## Database backups

Neon backup retention and point-in-time recovery are configured
through the Neon project settings. Verify the retention policy
and recovery window in the Neon Console.

Perform restore drills only against a separate test database.
Never test restore procedures against production.

## Release checklist

1. Run backend tests.
2. Run frontend production build.
3. Run the landing-page E2E smoke test.
4. Verify health and readiness endpoints.
5. Review Git diff before committing.
6. Deploy only after explicit approval.
