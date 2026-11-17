pipeline {
    agent any

    environment {
        IMAGE_NAME = "sunnykumar13/alertx-web"
        CONTAINER_NAME = "alertx-app"
    }

    stages {

        stage('Clone Repository') {
            steps {
                echo 'Cloning AlertX repository'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building AlertX Docker image'

                sh '''
                    docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} .
                    docker tag ${IMAGE_NAME}:${BUILD_NUMBER} ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login \
                            -u "$DOCKER_USER" --password-stdin

                        docker push ${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${IMAGE_NAME}:latest

                        docker logout
                    '''
                }
            }
        }

        stage('Deploy on EC2') {
            steps {
                sh '''
                    docker rm -f ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p 8000:8000 \
                        ${IMAGE_NAME}:${BUILD_NUMBER}

                    docker ps
                '''
            }
        }
    }

    post {
        success {
            echo 'AlertX deployed successfully on EC2!'
        }

        failure {
            echo 'AlertX pipeline failed. Check Jenkins console output.'
        }
    }
}
