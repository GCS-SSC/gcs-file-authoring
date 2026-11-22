# File authoring tests

Run the extension provider tests from this directory.

```sh
node ../../node_modules/vitest/vitest.mjs run
```

The tests intercept OpenAI requests and verify that the adapter sends the original file bytes for structured draft generation.
