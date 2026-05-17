pipeline{
    agent any
    stages{
        stage("git clone"){
            steps{
                echo "cloning start"
                git branch: 'main', url: 'https://github.com/sunnykumar37/AlertX.git'
                echo "cloning done"
            }
        }
        stage("build"){
            steps{
                    echo 'building project image'
                    sh "docker build -t sunnykumar13/alertx-web:${BUILD_NUMBER} ."
            }
        }

    }
}