# auto-commit.ps1
# Appelé automatiquement après chaque Write/Edit dans le projet KuroSekai.
# Lit le chemin du fichier modifié depuis stdin (JSON fourni par Claude Code),
# puis effectue un git add + git commit si le fichier appartient au projet.

$PROJET_DIR = "C:\Users\alexandre.gaillard\Desktop\KuroSekai"

# Lecture du JSON envoyé par Claude Code sur stdin
try {
    $raw  = [Console]::In.ReadToEnd()
    $json = $raw | ConvertFrom-Json
} catch {
    exit 0  # Pas de JSON valide, on sort silencieusement
}

# Récupération du chemin du fichier (deux champs possibles selon l'outil)
$filePath = ""
if ($json.tool_input.file_path)       { $filePath = $json.tool_input.file_path }
elseif ($json.tool_response.filePath) { $filePath = $json.tool_response.filePath }

# On ne commit que si le fichier est dans le projet KuroSekai
if (-not $filePath.StartsWith($PROJET_DIR)) { exit 0 }

# Chemin relatif pour un message de commit lisible
$relPath = $filePath.Replace($PROJET_DIR + "\", "").Replace($PROJET_DIR + "/", "")

# On se place à la racine du projet
Set-Location $PROJET_DIR

# Ajout du fichier à l'index git
git add $filePath 2>$null

# On vérifie qu'il y a bien quelque chose à committer (évite les commits vides)
git diff --cached --quiet 2>$null
if ($LASTEXITCODE -eq 0) { exit 0 }  # Rien à committer

# Message de commit automatique basé sur le chemin relatif
$commitMsg = "auto: update $relPath"

git commit -m $commitMsg 2>$null

exit 0
