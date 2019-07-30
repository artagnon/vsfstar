# vsfstar

A [Visual Studio Code](https://code.visualstudio.com) extension for [F*](https://fstar-lang.org), with support for hacking on the F* compiler baked in. Uses the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/overview) to provide the following features:

- [X] Lax-check entire file on open
- [X] Diagnostic reporting, with location information
- [X] Lax-check entire file on save
- [X] Go to definition
- [X] Hover information: type and documentation
- [X] Auto-complete

Requires [Z3 4.8.5](https://github.com/Z3Prover/z3/releases/tag/Z3-4.8.5) to be installed and the tip of [F* master](https://github.com/FStarLang/FStar) to be built. Configure `vsfstar.path` to point to the `fstar.exe` binary you built.

![Demo](https://media.giphy.com/media/LmemFFMyaAu3WHOWph/giphy.gif)
