Google TimesFM 2.5 Is a Compact Foundation Model Built Only for Forecasting
June 19 2026

Google Research's TimesFM 2.5 is an open source, pretrained foundation model for time series forecasting that runs on roughly 200 million parameters, accepts a context window of about 16,000 time steps, and tops a widely cited public benchmark that spans 28 forecasting datasets. It applies the same kind of large scale pretraining that powers language models, but it is aimed at one job only: predicting what a sequence of numbers does next.

## What makes TimesFM different from a chatbot model?

TimesFM borrows the decoder only transformer design from language models, with stacked causal self attention and feedforward layers, but it does not work on words. Instead of treating each number as a token, the model slices a series into patches of contiguous time points and treats each patch as a token, embedding it through a small neural block and adding positional information to preserve order.

That focus is the whole point. A general language model can describe a chart in prose, but TimesFM produces an actual numerical forecast across many domains without any task specific training, a property called zero shot forecasting. Google researchers introduced the approach in a 2024 ICML paper, and the model has been pretrained on billions of real world time points drawn from retail, energy, finance, and sensor data, which is what lets it generalize to a dataset it has never seen.

## How small is it really?

Version 2.5 actually shrank while getting stronger. The parameter count dropped from 500 million in the previous generation to about 200 million, and the context window grew from 2,048 steps to 16,384, so the model can look much further back while costing less to run. Google also added an optional 30 million parameter quantile head that produces probabilistic forecasts up to 1,000 steps into the future, and removed an older frequency indicator that made deployment fussier across mixed datasets.

The compact size is the selling point for businesses. A 200 million parameter model runs fast and cheap compared with frontier language models, which is why time series forecasting is one of the few AI areas where a small specialized model beats throwing a giant general model at the problem.

## How do you actually run it?

You have several paths. The open source package installs through pip, so a developer can load it in a Python environment directly. For people who live in spreadsheets and databases, Google wired TimesFM into BigQuery as a forecasting function callable from plain SQL, exposed it inside Google Sheets, and offers a managed endpoint in Vertex AI for production load. Since March 2026 the project even ships a machine readable skill file compatible with Claude Code and other agent systems, so an AI agent can call the model on its own. One caveat: the open release is explicitly not an officially supported Google product, so teams that need guarantees lean on the managed cloud paths. The repository climbed the GitHub trending charts on the strength of all of this. If you track where applied AI is going, watch the small specialized models.

[Check out what else is trending at GitHub Trending](https://www.cosmictesla.com/#github-trending)
