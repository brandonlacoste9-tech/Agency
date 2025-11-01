@echo off
echo.
echo ════════════════════════════════════════════
echo   PHASE-2 QUICKSTART — AUTO MODE
echo ════════════════════════════════════════════
echo.

REM Stage and commit Phase-2 files
git add .github\workflows\phase2.yml
git add .github\labeler.yml
git add copilot-instructions.md
git add COPILOT_GUARDRAILS.md
git add .github\pull_request_template.md
git add .github\copilot-instructions.md
git add setup-phase2.sh setup-phase2.bat
git add phase2-complete-setup.sh phase2-complete-setup.bat
git add PHASE2_SETUP_GUIDE.md PHASE2_FILES_CREATED.md PHASE2_QUICKSTART.md PHASE2_README.md
git add quickstart.bat

git commit -m "feat(phase2): add autonomous PR workflow infrastructure" -m "Complete Phase-2 setup with Copilot CCR + Claude integration"
git push origin main

echo [SUCCESS] Files committed and pushed
echo.
echo [INFO] Now run: setup-phase2.bat
echo        (It will create labels, project, and kickoff branch)
