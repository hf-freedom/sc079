import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, message } from 'antd';
import {
  CarOutlined,
  UserOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { carApi, userApi, rentalApi } from '../services/api';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCars: 0,
    availableCars: 0,
    totalUsers: 0,
    blacklistedUsers: 0,
  });
  const [recentRentals, setRecentRentals] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [carsRes, usersRes] = await Promise.all([
        carApi.getAll(),
        userApi.getAll(),
      ]);

      const cars = carsRes.data.data || [];
      const users = usersRes.data.data || [];

      setStats({
        totalCars: cars.length,
        availableCars: cars.filter(c => c.status === 'AVAILABLE').length,
        totalUsers: users.length,
        blacklistedUsers: users.filter(u => u.isBlacklisted).length,
      });

    } catch (error) {
      message.error('加载数据失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const carStatusColors = {
    AVAILABLE: 'green',
    RESERVED: 'orange',
    RENTED: 'blue',
    MAINTENANCE: 'red',
    DAMAGED: 'red',
  };

  const carStatusNames = {
    AVAILABLE: '可用',
    RESERVED: '已预订',
    RENTED: '租用中',
    MAINTENANCE: '维护中',
    DAMAGED: '损坏',
  };

  const creditLevelNames = {
    EXCELLENT: '优秀',
    GOOD: '良好',
    FAIR: '一般',
    POOR: '较差',
  };

  const creditLevelColors = {
    EXCELLENT: 'green',
    GOOD: 'blue',
    FAIR: 'orange',
    POOR: 'red',
  };

  return (
    <Spin spinning={loading}>
      <div>
        <h2 style={{ marginBottom: '24px' }}>系统仪表盘</h2>
        
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="车辆总数"
                value={stats.totalCars}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="可用车辆"
                value={stats.availableCars}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="用户总数"
                value={stats.totalUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="黑名单用户"
                value={stats.blacklistedUsers}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={12}>
            <Card title="车辆状态说明" style={{ height: '100%' }}>
              <div>
                <p><Tag color="green">AVAILABLE</Tag> 可用 - 车辆可正常租赁</p>
                <p><Tag color="orange">RESERVED</Tag> 已预订 - 用户已预订但未取车</p>
                <p><Tag color="blue">RENTED</Tag> 租用中 - 用户正在使用</p>
                <p><Tag color="red">MAINTENANCE</Tag> 维护中 - 车辆正在维护</p>
                <p><Tag color="red">DAMAGED</Tag> 损坏 - 车辆损坏待维修</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="用户信用等级说明" style={{ height: '100%' }}>
              <div>
                <p><Tag color="green">EXCELLENT</Tag> 优秀 - 信用最佳</p>
                <p><Tag color="blue">GOOD</Tag> 良好 - 信用良好</p>
                <p><Tag color="orange">FAIR</Tag> 一般 - 有轻微不良记录</p>
                <p><Tag color="red">POOR</Tag> 较差 - 无法租车，可能被拉黑</p>
              </div>
              <div style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                <p>说明：每1次违章+1分，每1次逾期+2分</p>
                <p>总分 >= 5分 → 信用较差，加入黑名单</p>
                <p>总分 >= 3分 → 信用一般</p>
                <p>总分 >= 1分 → 信用良好</p>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: '24px' }}>
          <Col xs={24}>
            <Card title="系统功能说明">
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '8px' }}><CarOutlined /> 车辆管理</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      查看和管理所有车辆，包括车辆状态、日租金、押金等信息
                    </p>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '8px' }}><UserOutlined /> 用户管理</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      查看和管理用户，包括驾照信息、信用等级、余额、黑名单状态
                    </p>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '8px' }}><ClockCircleOutlined /> 租赁管理</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      预订车辆、取车、还车、结算，完整的租车流程
                    </p>
                  </div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: '16px' }}>
                <Col xs={24} sm={8}>
                  <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '8px' }}><WarningOutlined /> 违章管理</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      导入违章记录，自动关联租赁订单，从押金扣除罚款
                    </p>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <h4 style={{ marginBottom: '8px' }}><SafetyOutlined /> 押金管理</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      违章观察期管理，定时任务释放剩余押金
                    </p>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
};

export default Dashboard;
