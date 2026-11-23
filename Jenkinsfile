// Pipeline de integración continua del gestor de tareas (Entrega 2, semana 5).
// Jenkins lo lee del repositorio y lo ejecuta con cada push a main:
// pruebas unitarias -> secretos -> construcción -> contenedores -> red -> comunicación.
pipeline {
  agent any

  options {
    disableConcurrentBuilds()          // los contenedores usan nombres fijos: un build a la vez
    timestamps()
    timeout(time: 20, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  triggers {
    githubPush()                       // webhook de GitHub (cuando Jenkins es accesible desde internet)
    pollSCM('H/2 * * * *')             // revisa GitHub cada 2 minutos y construye si hay un commit nuevo
  }

  environment {
    // La app publica el puerto 3000 en el motor Docker-in-Docker, que Jenkins alcanza como "docker"
    APP_URL = 'http://docker:3000'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        sh 'git log -1 --pretty=format:"Commit %h - %s (%an)"'
      }
    }

    stage('Verificar secretos') {
      steps {
        // Observación de la Entrega 1: ninguna contraseña puede quedar escrita en el repositorio
        sh '''
          if git ls-files --error-unmatch .env >/dev/null 2>&1; then
            echo "ERROR: el archivo .env está versionado"; exit 1
          fi
          if grep -nE '^[[:space:]]*[A-Z_]*(PASSWORD|SECRET|TOKEN)[A-Z_]*:[[:space:]]*[^[:space:]$]' docker-compose.yml; then
            echo "ERROR: docker-compose.yml tiene una contraseña escrita directamente"; exit 1
          fi
          echo "OK: .env no está versionado y docker-compose.yml solo usa variables \${...}"
        '''
      }
    }

    stage('Pruebas unitarias') {
      agent {
        docker {
          image 'node:20-alpine'
          reuseNode true
        }
      }
      environment {
        npm_config_cache = "${WORKSPACE}/.npm"
      }
      steps {
        dir('app') {
          sh 'node --version && npm --version'
          sh 'npm ci'
          sh 'npm audit --omit=dev --audit-level=high'
          sh 'npm test'
        }
      }
    }

    stage('Preparar .env desde credenciales') {
      steps {
        // El .env se toma de la credencial "Secret file" de Jenkins; nunca del repositorio
        withCredentials([file(credentialsId: 'gestor-tareas-env', variable: 'ENV_FILE')]) {
          sh 'cp "$ENV_FILE" .env && chmod 600 .env'
        }
      }
    }

    stage('Validar docker-compose.yml') {
      steps {
        sh 'docker compose config --quiet && echo "docker-compose.yml válido"'
      }
    }

    stage('Construir imagen de la app') {
      steps {
        sh 'docker compose build app'
      }
    }

    stage('Levantar contenedores') {
      steps {
        sh 'docker compose up -d --wait --wait-timeout 120'
        sh 'docker compose ps'
      }
    }

    stage('Inspeccionar red') {
      steps {
        // Evidencia de que app y db están en la misma red interna red_tareas
        sh 'docker network inspect red_tareas'
      }
    }

    stage('Prueba de comunicación') {
      steps {
        sh 'bash scripts/prueba-comunicacion.sh'
      }
    }
  }

  post {
    failure {
      sh 'docker compose logs --no-color || true'
    }
    always {
      sh 'docker compose down -v --remove-orphans || true'
      sh 'rm -f .env'
    }
    success {
      echo 'Pipeline completado: los contenedores app y db se construyeron y se comunican correctamente.'
    }
  }
}
