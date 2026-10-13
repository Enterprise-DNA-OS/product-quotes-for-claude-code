# Add a read-only view

Read views.json, scripts/view.mjs and the existing database views. Identify the question and the fields that answer it. Add a SELECT-only entry to views.json using trusted SQL, separate currencies and escape labels through the shared renderer. Add a numbered migration if a new database view is needed. Run npm test and npm run view. Inspect the generated HTML. Never add forms, action buttons, a server or sends.
