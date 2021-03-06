"use strict";

document.onload = console.log(document.styleSheets);

//parent component, renders board and controls and connects the two
var GameOfLife = React.createClass({
    displayName: "GameOfLife",

    //default board and control state
    getInitialState: function getInitialState() {
        return {
            height: 25,
            width: 25,
            interval: 500,
            pause: false,
            boardKey: 0,
            percentLife: 0.3,
            generations: 0,
            nextHeight: 25,
            nextWidth: 25
        };
    },
    //handles changes from input
    handleChange: function handleChange(event) {
        var newState = {};

        if (event.target.name === "interval") {
            //interval is set in second and needs to be converted to milliseconds
            newState[event.target.name] = event.target.value * 1000;
        } else if (event.target.name === "pause") {
            newState.pause = event.target.checked;
        } else if (event.target.name === "randomize") {
            this.setState({ empty: false }, this.resetBoard);
        } else if (event.target.name === "clear") {
            this.setState({ empty: true }, this.resetBoard);
        } else if (event.target.name === "width") {
            this.setState({ nextWidth: +event.target.value });
        } else if (event.target.name === "height") {
            this.setState({ nextHeight: +event.target.value });
        } else if (event.target.name === "percentLife") {
            newState.percentLife = event.target.value;
        } else if (event.target.name === "resetGenerations") {
            newState.generations = 0;
        } else if (event.target.name === "applySize") {
            console.log("this.state: ", this.state);
            this.setState({
                height: this.state.nextHeight,
                width: this.state.nextWidth
            }, this.resetBoard);
        }
        this.setState(newState);
    },
    //increases the generation count by one
    incrementGenereations: function incrementGenereations() {
        this.setState({ generations: this.state.generations + 1 });
    },
    resetBoard: function resetBoard() {
        this.setState({ boardKey: this.state.boardKey + 1, generations: 0 });
    },
    render: function render() {
        return React.createElement(
            "div",
            { id: "game-of-life" },
            React.createElement(
                "div",
                { id: "display" },
                React.createElement(FixedRatio, {
                    childComponents: React.createElement(Board, {
                        height: this.state.height,
                        width: this.state.width,
                        interval: this.state.interval,
                        pause: this.state.pause,
                        percentLife: this.state.percentLife,
                        empty: this.state.empty,
                        key: this.state.boardKey,
                        incrementGenereations: this.incrementGenereations
                    }),
                    ratio: this.state.width / this.state.height
                })
            ),
            React.createElement(Controls, {
                handleChange: this.handleChange,
                height: this.state.nextHeight,
                width: this.state.nextWidth,
                interval: this.state.interval,
                pause: this.state.pause,
                percentLife: this.state.percentLife,
                generations: this.state.generations
            })
        );
    }
});
//contains cells and game logic, accepts game parameters as props
//props include: height={int}, width={int}, play={bool}, interval={float}, borderSize={int}
var Board = React.createClass({
    displayName: "Board",

    getInitialState: function getInitialState() {
        //set inital board update rate if game is not paused
        var interval = undefined;
        if (this.props.pause === false) {
            interval = window.setInterval(this.update, this.props.interval);
        }

        //build initial cell values
        var initialCellValues = [];
        var size = this.props.height * this.props.width;
        for (var i = 0; i < size; i++) {
            if (!this.props.empty) {
                initialCellValues.push(Math.random() < this.props.percentLife);
            } else {
                initialCellValues.push(false);
            }
        }

        return {
            status: initialCellValues,
            interval: interval,
            cellNeighbors: this.buildCellNeighbors(),
            cellCount: this.props.height * this.props.width,
            cellStyle: {
                width: 100 / this.props.width + "%",
                height: 100 / this.props.height + "%" } };
    },
    //runs when prop(s) are updated
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
        window.clearInterval(this.state.interval);
        var newState = {};
        //if the new state isn't paused then once again set the interval
        if (nextProps.pause === false) {
            newState.interval = window.setInterval(this.update, nextProps.interval);;
        }
        this.setState(newState);
    },
    //returns an array with filled with an array for each cell with the index of that cells neighbors
    buildCellNeighbors: function buildCellNeighbors() {
        var cellNeighbors = [];
        //this.state.status.forEach(function(alive, i, status){
        for (var i = 0; i < this.props.height * this.props.width; i++) {
            var currentNeighbors = [];
            //determine if cell is on the top, left, right, or bottom of grid
            var top = this.props.width - i > 0;
            var left = i % this.props.width === 0;
            var right = i % this.props.width === this.props.width - 1;
            var bottom = (this.props.height - 1) * this.props.width < i + 1;
            /*console.log("cell " + i
                + "\n   top: " + top
                + "\n   left: " + left
                + "\n   right: " + right
                + "\n   bottom: " + bottom);*/
            //for each potential neighbor, if that neighbor isn't off the grid then add it's index to the array
            if (!top && !left) {
                currentNeighbors.push(i - this.props.width - 1);
            }
            if (!top) {
                currentNeighbors.push(i - this.props.width);
            }
            if (!top && !right) {
                currentNeighbors.push(i - this.props.width + 1);
            }
            if (!right) {
                currentNeighbors.push(i + 1);
            }
            if (!right && !bottom) {
                currentNeighbors.push(i + this.props.width + 1);
            }
            if (!bottom) {
                currentNeighbors.push(i + this.props.width);
            }
            if (!bottom && !left) {
                currentNeighbors.push(i + this.props.width - 1);
            }
            if (!left) {
                currentNeighbors.push(i - 1);
            }
            //console.log("neighbors: " + currentNeighbors);
            cellNeighbors.push(currentNeighbors);
        }
        return cellNeighbors;
    },
    //increments the game of life
    update: function update() {
        //new game of life board status
        var newStatus = [];
        //loops though previous game board and pushes the status of cells to the new board one at a time
        //this.state.status.forEach(function(alive, i, status){
        for (var i in this.state.cellNeighbors) {
            var neighbors = 0;
            //console.log("cell: " + i);
            for (var p in this.state.cellNeighbors[i]) {
                if (this.state.status[this.state.cellNeighbors[i][p]]) {
                    //console.log("   live neighbor at: " + this.state.cellNeighbors[i][p]);
                    neighbors++;
                }
            }
            //console.log("   " + neighbors + " live neighbors");
            /*
            RULES:
            +  Any live cell with fewer than two live neighbours dies, as if caused by under-population.
            +  Any live cell with two or three live neighbours lives on to the next generation.
            +  Any live cell with more than three live neighbours dies, as if by over-population.
            +  Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
            following code executes rules
            */
            if (neighbors < 2) {
                newStatus.push(false);
            } else if (neighbors === 2) {
                if (this.state.status[i]) {
                    newStatus.push(true);
                } else {
                    newStatus.push(false);
                }
            } else if (neighbors === 3) {
                newStatus.push(true);
            } else {
                newStatus.push(false);
            }
            //console.log("   new status: ", newStatus[newStatus.length - 1]);
        };
        //console.log("new status: ", newStatus);
        this.props.incrementGenereations();
        this.setState({ status: newStatus });
    },
    handleClick: function handleClick(event) {
        //gets index of cell that was clicked
        var cell = Array.prototype.indexOf.call(event.target.parentNode.children, event.target);
        this.state.status[cell] = !this.state.status[cell];
        this.setState({ status: this.state.status });
    },
    componentWillUnmount: function componentWillUnmount() {
        window.clearInterval(this.state.interval);
    },
    render: function render() {
        var _this = this;

        var cells = this.state.status.map(function (alive, index) {
            return React.createElement(Cell, {
                status: alive,
                style: _this.state.cellStyle,
                key: index
            });
        });
        return React.createElement(
            "div",
            { className: "display-ratio-fixed", onClick: this.handleClick },
            cells
        );
    }
});
//Creates a div of a given ratio (width/hight) as large as it can in the given context and then renders whatever is passed as the prop "childComponents" and it's children". Has a 200ms resize timeout for performance.
//props: include: ratio={width/height}, childComponents={compoenents to be rendered as children}
var FixedRatio = React.createClass({
    displayName: "FixedRatio",

    getInitialState: function getInitialState() {
        return { style: { visibility: "hidden" }, domNode: undefined };
    },
    componentDidMount: function componentDidMount() {
        this.remeasure();
        window.addEventListener("resize", this.remeasure);
    },
    componentWillUnmount: function componentWillUnmount() {
        window.removeEventListener("resize", this.remeasure);
    },
    remeasure: function remeasure() {
        //timeout code so that we don't remeasure for every step while the window is being resized
        window.clearTimeout(this.state.remeasureTimeout);
        var remeasureTimeout = window.setTimeout(run.bind(this), 200);
        this.setState({ remeasureTimeout: remeasureTimeout });
        function run() {
            //if the context ratio is wider than the target ratio
            if (this.state.domNode.offsetWidth / this.state.domNode.offsetHeight > this.props.ratio) {
                this.setState({ style: {
                        height: this.state.domNode.offsetHeight + "px",
                        width: this.state.domNode.offsetHeight * this.props.ratio + "px",
                        margin: "auto"
                    } });
            } else {
                this.setState({ style: {
                        height: this.state.domNode.offsetWidth / this.props.ratio + "px",
                        width: this.state.domNode.offsetWidth,
                        paddingTop: (this.state.domNode.offsetHeight - this.state.domNode.offsetWidth / this.props.ratio) / 2
                    } });
            }
        }
    },
    //if the ratio prop changes then remeasure, this is not in the "render" fuction because we do not want to remeaure when the childComponents prop changes
    componentWillReceiveProps: function componentWillReceiveProps(newProps) {
        if (newProps.ratio !== this.props.ratio) {
            this.remeasure();
        }
    },
    updateDOMRef: function updateDOMRef(node) {
        this.setState({ domNode: node });
    },
    render: function render() {
        //returns a div that we will use to measure the space we have and a <div> that we will size depending on the ratio given
        return React.createElement(
            "div",
            {
                style: { height: "100%", width: "100%" },
                ref: this.updateDOMRef
            },
            React.createElement(
                "div",
                { style: this.state.style },
                this.props.childComponents
            )
        );
    }
});

var Cell = function Cell(props) {
    return React.createElement("div", { className: props.status ? "alive" : "dead",
        style: props.style });
};
var Controls = React.createClass({
    displayName: "Controls",

    render: function render() {
        return React.createElement(
            "div",
            { id: "controls" },
            React.createElement(
                "div",
                { className: "controls-wrap" },
                React.createElement(
                    "label",
                    null,
                    "Refresh Delay"
                ),
                React.createElement("input", {
                    onChange: this.props.handleChange,
                    className: "slider",
                    type: "range",
                    value: this.props.interval / 1000,
                    name: "interval",
                    min: "0.05",
                    max: "1",
                    step: "0.05" }),
                React.createElement(
                    "span",
                    null,
                    (this.props.interval / 1000).toFixed(2),
                    " seconds"
                )
            ),
            React.createElement(
                "div",
                { className: "controls-wrap" },
                React.createElement(
                    "span",
                    { className: "generations" },
                    this.props.generations,
                    " Generations"
                ),
                React.createElement("input", {
                    className: "button",
                    type: "button",
                    onClick: this.props.handleChange,
                    name: "resetGenerations",
                    value: "reset" })
            ),
            React.createElement("br", null),
            React.createElement(
                "div",
                { className: "controls-wrap" },
                React.createElement("input", {
                    className: "button",
                    type: "button",
                    onClick: this.props.handleChange,
                    name: "randomize",
                    value: "randomize" }),
                React.createElement("input", {
                    onChange: this.props.handleChange,
                    className: "slider",
                    type: "range",
                    defaultValue: this.props.percentLife,
                    name: "percentLife",
                    min: "0",
                    max: "1",
                    step: "0.01" }),
                React.createElement(
                    "span",
                    { style: { textAlign: "right", width: "38px" } },
                    (this.props.percentLife * 100).toFixed(0),
                    "%"
                )
            ),
            React.createElement(
                "div",
                { className: "controls-wrap" },
                React.createElement("input", {
                    className: "button",
                    type: "button",
                    onClick: this.props.handleChange,
                    name: "clear",
                    value: "clear" })
            ),
            React.createElement(
                "div",
                { className: "controls-wrap" },
                React.createElement(
                    "label",
                    null,
                    "Pause"
                ),
                React.createElement(Switch, {
                    onChange: this.props.handleChange,
                    checked: this.props.pause,
                    name: "pause" })
            ),
            React.createElement("br", null),
            React.createElement(
                "div",
                { className: "controls-wrap" },
                React.createElement(
                    "span",
                    null,
                    "Size:"
                ),
                React.createElement("input", {
                    type: "number",
                    className: "text-input",
                    onChange: this.props.handleChange,
                    name: "width",
                    defaultValue: this.props.width }),
                React.createElement(
                    "span",
                    null,
                    "x"
                ),
                React.createElement("input", {
                    type: "number",
                    className: "text-input",
                    onChange: this.props.handleChange,
                    name: "height",
                    defaultValue: this.props.height }),
                React.createElement("input", {
                    className: "button",
                    type: "button",
                    onClick: this.props.handleChange,
                    name: "applySize",
                    value: "Apply" })
            )
        );
    }
});
var Switch = function Switch(props) {
    return React.createElement(
        "label",
        { className: "toggle" },
        React.createElement("input", {
            type: "checkbox",
            onChange: props.onChange,
            checked: props.checked ? true : false,
            name: props.name }),
        React.createElement("div", null)
    );
};
window.onload = function () {
    ReactDOM.render(React.createElement(GameOfLife, null), document.getElementById("container"));
};
//# sourceMappingURL=game-of-life.js.map
