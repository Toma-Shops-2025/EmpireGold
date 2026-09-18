# Findr database

Postgres **+ PostGIS** for profiles and coarse nearby queries.

## Local (Docker)

From `findr/`:

```bash
docker compose up -d db
```

Then apply migrations:

```bash
docker compose exec -T db psql -U findr -d findr < db/migrations/001_init.sql
```

Default connection string:

```
postgres://findr:findr@localhost:5432/findr
```

## Notes

- Store **fuzzed** coordinates only; return distance bands to clients, never exact pins.
- `users.date_of_birth` enforces 18+ at the DB layer as a backstop — still gate in the API/app.
