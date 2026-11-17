pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out AlertX repository'
                checkout scm
            }
        }

        stage('Validate Docker Compose') {
            steps {
                sh 'docker compose -p alertx config --quiet'
            }
        }

        stage('Deploy AlertX') {
            steps {
                sh '''
                    docker compose -p alertx up -d --build --remove-orphans
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    docker compose -p alertx ps
                    docker ps
                '''
            }
        }
    }

    post {
        success {
            echo 'AlertX deployment completed successfully!'
        }
        failure {
            echo 'Deployment failed. Check the Jenkins console output.'
        }
    }
}
