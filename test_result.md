#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: >
  Créer une page d'atterrissage (landing page) pour distribuer l'installeur Sparkle
  et le plugin BetterDiscord AutoQuest, indépendamment. L'assistant d'installation
  précédent est remplacé complètement par cette landing. AutoQuest est mis en avant
  comme faisant partie de Sparkle. Sections: Hero, Présentation, Fonctionnalités, FAQ.

backend:
  - task: "Endpoint /api/plugin/download (téléchargement du plugin AutoQuest.plugin.js)"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Nouvel endpoint ajouté pour servir AutoQuest.plugin.js en pièce jointe (application/javascript). Vérifié via curl: 200 + content-disposition correct."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED. Endpoint returns HTTP 200, correct content-type (application/javascript), content-disposition with filename 'AutoQuest.plugin.js', body is 120612 bytes (~117KB), and starts with plugin header '@name AutoQuest'. Plugin metadata correctly parsed (name: AutoQuest, author: 999none, version: 1.5.0)."
  - task: "Endpoints existants /api/info, /api/installer/download, /api/stats"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Non modifiés fonctionnellement. Restauration des .env manquants (MONGO_URL, DB_NAME, REACT_APP_BACKEND_URL). Backend redémarre correctement."
        -working: true
        -agent: "testing"
        -comment: "✅ ALL TESTS PASSED. GET /api/info returns correct JSON with extension, plugin (name=AutoQuest, author=999none, version=1.5.0, description), steps, and platform fields. GET /api/installer/download?autoquest=true returns HTTP 200 with content-disposition filename 'Sparkle.exe' and correct content-type. GET /api/stats returns downloads count and correctly increments after download (verified: count increased from 4 to 5 after triggering /api/plugin/download). MongoDB integration working correctly."

frontend:
  - task: "Landing page AutoQuest by Sparkle (Hero, Présentation, Fonctionnalités, FAQ)"
    implemented: true
    working: "NA"
    file: "frontend/src/App.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
        -agent: "main"
        -comment: "Assistant remplacé par une landing page single-page. Boutons de téléchargement installeur + plugin, nav ancres, FAQ accordéon. Rendu vérifié par screenshot."

metadata:
  created_by: "main_agent"
  version: "1.2"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Endpoint /api/plugin/download (téléchargement du plugin AutoQuest.plugin.js)"
    - "Endpoints existants /api/info, /api/installer/download, /api/stats"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
    -message: "Landing page créée et .env restaurés. Merci de tester les endpoints backend: GET /api/info (JSON extension+plugin), GET /api/plugin/download (doit renvoyer 200, content-type application/javascript, content-disposition attachment filename AutoQuest.plugin.js, corps = fichier JS non vide), GET /api/installer/download?autoquest=true (200, filename Sparkle.exe), GET /api/stats (compteur downloads incrémenté). Vérifier que /api/stats augmente après un download."
    -agent: "testing"
    -message: "✅ Backend testing complete. All 23 tests passed (4 endpoints tested). Created comprehensive backend_test.py at /app/backend_test.py. All endpoints working correctly: /api/info returns proper JSON structure with plugin metadata, /api/plugin/download serves 117KB plugin file with correct headers, /api/installer/download serves Sparkle.exe, /api/stats tracks downloads correctly with MongoDB. No issues found. Backend is production-ready."

