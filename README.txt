MNIST AI LAB — Cafe24 deployment build

1. Upload this entire folder to your Cafe24 web hosting space.
2. Put YOUR actual files into:
   data/training_log.json
   data/test_evaluation.json
3. The trained TensorFlow.js model is loaded from your GitHub Raw URL:
   https://raw.githubusercontent.com/Nick-Stokes/mnist-tfjs/refs/heads/main/model.json

Important:
- model.json references weights.bin, so weights.bin must exist in the same GitHub repository/path as model.json.
- Cafe24 is ONLY the deployment/hosting destination; the model remains on GitHub Raw.
- Do not open index.html by double-clicking it as file://. Test through Cafe24 HTTP/HTTPS.
- The JSON data files are loaded from the Cafe24 server with relative paths.
- TensorFlow.js itself is loaded from jsDelivr CDN.
- Your JSON files are intentionally NOT included in this ZIP.

Expected structure:
mnist-ai-lab/
  index.html
  result.html
  app.js
  result.js
  style.css
  data/
    training_log.json
    test_evaluation.json

Main page:
- Draw digit
- TensorFlow.js CNN inference
- Predicted digit / confidence / 0–9 probabilities
- Training loss/accuracy from training_log.json

Results page:
- Original image
- Prediction / probabilities
- Conv1 26×26×32 feature maps
- Conv2 11×11×64 feature maps

FIXED BUILD NOTES
- index.html can be placed in the Cafe24 web root.
- app.js/style.css are loaded relative to index.html; keep them beside index.html.
- training_log.json is resolved relative to the page URL as ./data/training_log.json.
- test_evaluation.json is resolved relative to result.html as ./data/test_evaluation.json.
- The model is NOT hosted on Cafe24. It is loaded from the GitHub Raw model.json URL.
- model.json references weights.bin, and the GitHub repository currently contains both files.
- The pages now show a DIAGNOSTICS line with the exact data URL being requested.
- If the page says MODEL — ERROR, the status line now reports the specific model-loading stage.

RESULTS FIX
- Your actual test_evaluation(1).json stores original_image as an object with shape + data.
- result.js now reads original_image.data correctly.
- Feature maps are also read from their shape + data objects.
- Prev/Next rendering errors are surfaced in the page instead of uncaught console errors.
