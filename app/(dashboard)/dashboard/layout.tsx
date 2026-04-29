import React from 'react';
import DashboardWrapper from '../../../components/dashboard/dashbaord-wrapper';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
    return <DashboardWrapper>{children}</DashboardWrapper>;
};

export default DashboardLayout;

