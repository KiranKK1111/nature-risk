import * as React from "react";
import { getAssetUrl } from "../utils/publicPath";

export default function HomePage(): JSX.Element {
    return (
        <div>
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h1>Welcome to the Nature Geospatial Tool</h1>
                <p>Explore the features and insights provided by this application.</p>
                <img 
                    src={getAssetUrl('static/images/home_icon.jpeg')}
                    alt="Home Banner" 
                    style={{ maxWidth: '300px', marginTop: '20px' }} 
                />
            </div>
        </div>
    );
}