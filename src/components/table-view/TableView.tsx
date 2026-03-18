import * as React from "react";
import { useSelector } from 'react-redux';
import CustomSpinner from '../tree-menu/CustomSpinner';

const TableView = () => {
    const ClientAssetsTable = React.useMemo(() => {
        return React.lazy(() => import('../table-view/clientAssets.jsx'));
    }, []);

    const loadingData = useSelector((state: any) => state.geoJson.loadingData);
    if (loadingData) {
        return <CustomSpinner />;
    }

    return (
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <React.Suspense fallback={<CustomSpinner />}>
                <ClientAssetsTable />
            </React.Suspense>
        </div>
    );
};
export default TableView;