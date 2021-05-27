import React from 'react';
import NewMeeting from "./pages/new_meeting";
import Meeting from "./pages/meeting";
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";

function App() {
    return (
        <Router>
            <Switch>
                <Route path="/meeting/:id" exact={true}>
                    <Meeting />
                </Route>
                <Route path="/">
                    <NewMeeting />
                </Route>
            </Switch>
        </Router>
    )
}

export default App;
