# GAS-TaskAutomation: Main Solution Blocks

A simplified Mermaid diagram of the main solution blocks:

```mermaid
flowchart TD
A[To-Do List: Fetch & filter tasks]
B[Router: Classify & assign]
C[Worker: Do the task]
D[Reporting: Email & mark done]
A --> B
B --> C
C --> D
```

If the diagram does not render, ensure you have a Mermaid-enabled Markdown preview extension in VS Code or use an online Mermaid live editor.