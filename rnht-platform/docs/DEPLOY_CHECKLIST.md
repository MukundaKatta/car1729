# RNHT Deploy Checklist

1. Install dependencies
   - `npm ci`

2. Verify tests
   - `npm run test:run`

3. Build the static export
   - `npm run build`

4. Sanity-check generated output
   - Confirm `out/` exists
   - Spot-check canonical metadata in `out/index.txt` or `out/services/index.txt`

5. Push code
   - `git push origin main`

6. Deploy hosting
   - `firebase deploy --only hosting`

7. Smoke-test live routes
   - `https://rnht-platform.web.app/`
   - `https://rnht-platform.web.app/services/`
   - `https://rnht-platform.web.app/donate/`
   - `https://rnht-platform.web.app/login/`
   - `https://rnht-platform.web.app/contact/`

8. Cache-bust metadata checks when needed
   - `curl -L 'https://rnht-platform.web.app/?v=TIMESTAMP' | rg 'canonical|rnht-platform.web.app'`

Notes:
- The `--localstorage-file` build warning does not appear to come from the RNHT repo. It looks external to app code.
- The local `.firebase/` folder is machine state and does not need to be committed.
