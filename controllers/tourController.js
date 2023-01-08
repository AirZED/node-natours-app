const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);
//I am using the sync readFile method because we are in the top level code and the blocking won't affect the event loop

//ROUTES HANDLERS
exports.getAlltours = (req, res) => {
  console.log(req.requestTime);
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

exports.getSingltour = (req, res) => {
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

exports.postAlltours = (req, res) => {
  const newId = tours.length + 1;

  //the object to assign merges two arrays
  const newTour = Object.assign({ _id: newId }, req.body);
  res.send('deleted successfully');
  tours.push(newTour);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
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

exports.patchtour = (req, res) => {
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
    `${__dirname}/../dev-data/data/tours-simple.json`,
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

exports.deleteSingletour = (req, res) => {
  const { id: tourId } = req.params;

  if (tours.length < +tourId) {
    return res.status(404).json({
      status: 'failed',
      message: 'could not locate tour in db',
    });
  }
  tours.splice(+tourId, 1);

  fs.writeFile(
    `${__dirname}/../dev-data/data/tours-simple.json`,
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
          `${__dirname}/../dev-data/data/tours-simple.json`,
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
