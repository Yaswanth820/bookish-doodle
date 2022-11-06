# bookish-doodle

## To run the application

1. Clone the repository
2. Run `npm install`
3. Run `npm start`

## To run the tests

1. Run `npm test`

## Using docker

1. Build the image for testing `docker build -t test-app --target test .`
2. Run the tests `docker run -it --rm test-app`
3. Build the image for production `docker build -t prod-app --target prod .`
4. Run the application `docker run -it --rm prod-app`

## Using docker-compose

1. Run `docker-compose up`

Deploy [link](https://social-media-api-ybnl.onrender.com)
