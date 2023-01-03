const express = require('express');
const fs = require('fs');
const morgan = require('morgan');

const app = express();

const port = 3000;

//including middleware
app.use(express.json());
app.use(morgan('dev'));

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);
//I am using the sync readFile method because we are in the top level code and the blocking won't affect the event loop

const getAlltours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

const getSingltour = (req, res) => {
  const { id: tourId } = req.params;

  // const matchedTour = tours.find((tour) => tour._id === tourId);

  const matchedTour = tours[+tourId];

  //incase param value is too large
  if (!matchedTour) {
    return res.status(404).json({
      status: 'failed',
      message: {
        message: 'Could not locate tour in database',
      },
    });
  }

  res.status(200).json({
    status: 'success',
    data: { matchedTour },
  });
};

const postAlltours = (req, res) => {
  const newId = tours.length + 1;

  //the object to assign merges two arrays
  const newTour = Object.assign({ _id: newId }, req.body);
  res.send('deleted successfully');
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err, data) => {
      if (err) {
        return res.status(404).json({
          status: 'failed',
          message: {
            message: 'Could not add tour to database',
          },
        });
      }
      res.status(201).json({
        status: 'success',
        data: { tour: newTour },
      });
    }
  );
};

const patchtour = (req, res) => {
  const { id: tourId } = req.params;
  const patch = req.body;

  // const matchedTour = tours.find((tour) => tour._id === tourId);
  const matchedTour = tours[+tourId];

  //incase param value is too large
  if (!matchedTour) {
    return res.status(404).json({
      status: 'failed',
      message: {
        message: 'Could not locate tour in database',
      },
    });
  }

  //creating a new object based on the old and very importantly new properties
  const patchedTour = Object.assign(matchedTour, patch);

  //mutating the array to hold now object
  tours.splice(+tourId, 1, patchedTour);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err, data) => {
      if (err) {
        return res.status(404).json({
          status: 'failed',
          message: {
            message: 'Could not locate tour in database',
          },
        });
      }

      res.status(200).json({
        status: 'success',
        tour: {
          tour: patchedTour,
        },
      });
    }
  );
};

const deleteSingletour = (req, res) => {
  const { id: tourId } = req.params;

  if (tours.length < +tourId) {
    return res.status(404).json({
      status: 'failed',
      message: 'could not locate tour in db',
    });
  }
  tours.splice(+tourId, 1);

  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,
    JSON.stringify(tours),
    (err, data) => {
      (req, res) => {
        const { id: tourId } = req.params;

        if (tours.length < +tourId) {
          return res.status(404).json({
            status: 'failed',
            message: 'could not locate tour in db',
          });
        }
        tours.splice(+tourId, 1);

        fs.writeFile(
          `${__dirname}/dev-data/data/tours-simple.json`,
          JSON.stringify(tours),
          (err, data) => {
            if (err) {
              return res.status(404).json({
                status: 'failed',
                message: 'tour not found',
              });
            }

            res.status(204).json({
              status: 'success',
              data: null,
            });
          }
        );
      };
      if (err) {
        return res.status(404).json({
          status: 'failed',
          message: 'tour not found',
        });
      }

      res.status(204).json({
        status: 'success',
        data: null,
      });
    }
  );
};
// //handles sending all tours to clients
// app.get('/api/v1/tours', getAlltours);
// app.get(`/api/v1/tours/:id`, getSingltour);
// //handles posting tour to client
// app.post('/api/v1/tours', postAlltours);
// app.patch(`/api/v1/tours/:id`, patchtour);
// app.delete(`/api/v1/tours/:id`, deleteSingletour);

app.route(`/api/v1/tours`).get(getAlltours).post(postAlltours);

app
  .route(`/api/v1/tours/:id`)
  .get(getSingltour)
  .patch(patchtour)
  .delete(deleteSingletour);
//start up a server
app.listen(port, () => {
  console.log('app running on port ' + port);
});
