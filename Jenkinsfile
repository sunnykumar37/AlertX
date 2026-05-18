pipeline{
agent any

stages{

    stage("git clone"){
        steps{
            echo "cloning start"

            git branch: 'main',
            url: 'https://github.com/sunnykumar37/AlertX.git'

            echo "cloning done"
        }
    }

    stage("build"){
        steps{
            echo 'building project image'

            sh "docker build -t sunnykumar13/alertx-web:${BUILD_NUMBER} ."
        }
    }

    stage("Push Images") {

        steps {

            withCredentials([

                usernamePassword(
                    credentialsId: 'docker_cred',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )

            ]) {

                sh '''
                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                docker push sunnykumar13/alertx-web:${BUILD_NUMBER}
                '''
            }
        }
    }

    stage("Deploy to Kubernetes") {

        steps {

            sh '''
            kubectl set image deployment/alertx-deployment alertx=sunnykumar13/alertx-web:${BUILD_NUMBER}

            kubectl rollout status deployment/alertx-deployment
            '''
        }
    }
}

post {

    success {

        emailext(
            subject: "✅ Pipeline SUCCESS - Build #${BUILD_NUMBER}",
            body: "Build #${BUILD_NUMBER} completed successfully.",
            to: "snarwal2005@gmail.com"
        )
    }

    failure {

        emailext(
            subject: "❌ Pipeline FAILED - Build #${BUILD_NUMBER}",
            body: "Build #${BUILD_NUMBER} FAILED. Check Jenkins logs.",
            to: "snarwal2005@gmail.com"
        )
    }
}


}
