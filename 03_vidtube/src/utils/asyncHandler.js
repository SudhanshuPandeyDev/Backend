// Purpose: Simplifies error handling for asynchronous route handlers by catching errors and sending standardized responses, preventing the need for repetitive try-catch blocks.

// BASIC INFO. ABOUT BOTH SYNTAX
// 1. asyncHandler is a higher order fn which contains first wrapper fn and a second inner middleware fn
// 2. The first fn (fn) is the wrapper around the actual route handler. The second fn (inside) is the actual route handler that will catch any errors.

// 1. PROMISES SYNTAX
// Wrap the requestHandler in Promise.resolve and catch any errors
// Pass the error to the error-handling middleware
// In Promise.resolve() if you pass another Promise It returns the same Promise
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };

/*
// 2. USING ASYNC AWAIT AND TRY CATCH SYNTAX
const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next); // Execution of the passed fn
  } catch (error) {
    res.status(error.code || 500).json({
      success: false,
      message: error.message,
    });
  }
};
*/
