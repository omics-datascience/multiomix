# Security & Code Quality

Multiomix uses [SonarQube](https://www.sonarsource.com/products/sonarqube/) (via SonarCloud) to ensure code quality and catch maintainability and security issues early in the development process.

SonarQube is a static analysis platform that scans source code for bugs, vulnerabilities, and code quality problems across multiple languages — in our case, Python (Django backend) and TypeScript/JavaScript (React frontend).

> **Heads up:** Since Multiomix is a public repository, its SonarCloud analysis results are [publicly visible](https://sonarcloud.io/project/overview?id=omics-datascience_multiomix) — no login required — including reported vulnerabilities. Keep this in mind: any unresolved security issue detected by SonarQube is effectively public information. We treat this as an additional incentive to address findings promptly.

---

## Pull Request Analysis

Every pull request targeting `main`, `develop`, `feature/**`, or `bugfix/**` branches is automatically scanned by SonarQube via GitHub Actions.

If your changes introduce issues, SonarQube will report warnings with varying severity levels and categories. This information will be visible directly on the PR. For minor issues, they serve as useful guidance to improve your contribution. For more significant problems, Multiomix maintainers will leave a review pointing out what needs to be addressed before the PR can be merged.

---

## Setting Up SonarQube Locally (for contributors and self-hosters)

If you want to run SonarQube analysis on your own fork or deployment, follow these steps:

1. **Create a SonarCloud account** at [sonarcloud.io](https://sonarcloud.io) and log in with your GitHub account.

2. **Create a new project** linked to your fork of the Multiomix repository.

3. **Generate a token**: go to *My Account → Security → Generate Token* and copy it.

4. **Configure the following GitHub Actions secrets** in your repository (*Settings → Secrets and variables → Actions*):

   | Secret | Value |
   |--------|-------|
   | `SONAR_TOKEN` | The token generated in the previous step |
   | `SONAR_HOST_URL` | `https://sonarcloud.io` |

5. Once configured, the workflow defined in `.github/workflows/sonarqube-pr.yaml` will run automatically on every qualifying pull request.

> **Note:** The project key and organization in the workflow (`omics-datascience_multiomix` / `omics-datascience`) correspond to the official Multiomix project. If you're running your own instance, update those values to match your SonarCloud project.

---

## Contact

Found a security issue or have a question about the project?

- Email us at [multiomix@gmail.com](mailto:multiomix@gmail.com)
- Open an issue on [GitHub](https://github.com/omics-datascience/multiomix/issues)
- Submit a pull request directly on [GitHub](https://github.com/omics-datascience/multiomix)