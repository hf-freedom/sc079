import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Layout, Menu, ConfigProvider } from 'antd';
import {
  CarOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  HomeOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import zhCN from 'antd/locale/zh_CN';
import Dashboard from './pages/Dashboard';
import CarManagement from './pages/CarManagement';
import UserManagement from './pages/UserManagement';
import RentalManagement from './pages/RentalManagement';
import ViolationManagement from './pages/ViolationManagement';
import DepositManagement from './pages/DepositManagement';

const { Header, Content, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">仪表盘</Link>,
    },
    {
      key: '/cars',
      icon: <CarOutlined />,
      label: <Link to="/cars">车辆管理</Link>,
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: <Link to="/users">用户管理</Link>,
    },
    {
      key: '/rentals',
      icon: <FileTextOutlined />,
      label: <Link to="/rentals">租赁管理</Link>,
    },
    {
      key: '/violations',
      icon: <WarningOutlined />,
      label: <Link to="/violations">违章管理</Link>,
    },
    {
      key: '/deposits',
      icon: <SafetyOutlined />,
      label: <Link to="/deposits">押金管理</Link>,
    },
  ];

  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
            <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
              {collapsed ? '租车' : '租车管理系统'}
            </div>
            <Menu
              theme="dark"
              defaultSelectedKeys={['/']}
              mode="inline"
              items={menuItems}
            />
          </Sider>
          <Layout className="site-layout">
            <Header className="site-layout-background" style={{ padding: 0 }}>
              <div style={{ paddingLeft: '24px', fontSize: '16px' }}>
                个人租车押金违章保险还车结算系统
              </div>
            </Header>
            <Content style={{ margin: '16px' }}>
              <div className="site-layout-content">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/cars" element={<CarManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/rentals" element={<RentalManagement />} />
                  <Route path="/violations" element={<ViolationManagement />} />
                  <Route path="/deposits" element={<DepositManagement />} />
                </Routes>
              </div>
            </Content>
          </Layout>
        </Layout>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
