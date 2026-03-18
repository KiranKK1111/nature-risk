import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import 'leaflet/dist/leaflet.css';
import { BrowserRouter } from 'react-router-dom';
import { isContainerMode } from "./utils";
import FastaiAppContainer from './FastAIContainer';

const devmount = (el, {basename="/"}={}) => {
  ReactDOM.render(
    <BrowserRouter basename={basename}>
      <FastaiAppContainer />
    </BrowserRouter>,
    el
  );
}

if (process.env.NODE_ENV === "development" && !isContainerMode()) {
  const devRoot = document.getElementById("natureriskdev");

  if (devRoot) {
    devmount(devRoot,{basename:"/"});
  }
}

export default App;

