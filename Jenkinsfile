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

    }
}