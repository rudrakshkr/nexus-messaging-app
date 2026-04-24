class CustomNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.statusCode = 404;
        this.name = "Page-Not-Found-Error";
    }
}

module.exports = CustomNotFoundError;