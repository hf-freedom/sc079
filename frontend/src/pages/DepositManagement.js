import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Tag, Button, Modal, message, Space, Descriptions, 
  Divider, Statistic, Row, Col, Alert, Popconfirm 
} from 'antd';
import { 
  ReloadOutlined, SafetyOutlined, ClockCircleOutlined, 
  CheckCircleOutlined, WalletOutlined, CarOutlined, 
  UnlockOutlined, ExportOutlined
} from '@ant-design/icons';
import { rentalApi, userApi, carApi, depositApi } from '../services/api';
import dayjs from 'dayjs';

const DepositManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [releasing, setReleasing] = useState(false);
  const [stats, setStats] = useState({
    totalFrozen: 0,
    inObservation: 0,
    readyToRelease: 0,
  });

  const orderStatusNames = {
    RESERVED: '已预订',
    PICKED_UP: '已取车',
    RETURNED: '已还车',
    SETTLED: '已结算',
    CANCELLED: '已取消',
  };

  const orderStatusColors = {
    RESERVED: 'orange',
    PICKED_UP: 'blue',
    RETURNED: 'purple',
    SETTLED: 'green',
    CANCELLED: 'default',
  };

  const canReleaseDeposit = (order) => {
    if (order.depositReleased) return false;
    const remaining = order.remainingDeposit !== null && order.remainingDeposit !== undefined 
      ? order.remainingDeposit 
      : order.frozenDeposit;
    return remaining > 0;
  };

  const isObservationOver = (order) => {
    if (!order.violationObservationEndTime) return false;
    return dayjs().isAfter(dayjs(order.violationObservationEndTime));
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
    },
    {
      title: '用户',
      dataIndex: ['user', 'realName'],
      key: 'user',
    },
    {
      title: '车辆',
      key: 'car',
      render: (_, record) => (
        <span>
          {record.car?.brand} {record.car?.model}
          <br />
          <Tag size="small">{record.car?.plateNumber}</Tag>
        </span>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={orderStatusColors[status]}>
          {orderStatusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '冻结押金',
      dataIndex: 'frozenDeposit',
      key: 'frozenDeposit',
      render: (deposit) => <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>¥{deposit}</span>,
    },
    {
      title: '剩余押金',
      dataIndex: 'remainingDeposit',
      key: 'remainingDeposit',
      render: (deposit, record) => {
        const remaining = deposit !== null && deposit !== undefined 
          ? deposit 
          : record.frozenDeposit;
        return (
          <span style={{ 
            fontWeight: 'bold', 
            color: remaining > 0 ? '#1890ff' : '#999' 
          }}>
            ¥{remaining}
          </span>
        );
      },
    },
    {
      title: '违章观察期',
      key: 'observation',
      render: (_, record) => {
        if (!record.violationObservationEndTime) {
          return <Tag color="default">未开始</Tag>;
        }
        
        const endTime = dayjs(record.violationObservationEndTime);
        const now = dayjs();
        const isOverdue = now.isAfter(endTime);
        
        if (isOverdue) {
          return <Tag color="green">观察期已结束</Tag>;
        }
        
        const hoursLeft = endTime.diff(now, 'hour');
        const daysLeft = Math.ceil(hoursLeft / 24);
        
        return (
          <div>
            <Tag color="orange">观察中</Tag>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              剩余 {daysLeft} 天
            </div>
          </div>
        );
      },
    },
    {
      title: '押金释放',
      dataIndex: 'depositReleased',
      key: 'depositReleased',
      render: (released) => {
        if (released === null || released === undefined) {
          return <Tag color="default">未释放</Tag>;
        }
        return released 
          ? <Tag color="green">已释放</Tag> 
          : <Tag color="orange">待释放</Tag>;
      },
    },
    {
      title: '还车时间',
      dataIndex: 'actualReturnTime',
      key: 'actualReturnTime',
      render: (time) => time ? dayjs(time).format('MM-DD HH:mm') : '-',
      width: 130,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Button 
            type="link" 
            size="small"
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          {canReleaseDeposit(record) && (
            <>
              {record.status === 'SETTLED' && isObservationOver(record) ? (
                <Popconfirm
                  title="确定要手动释放押金吗？"
                  description={`将释放剩余押金 ¥${record.remainingDeposit !== null && record.remainingDeposit !== undefined ? record.remainingDeposit : record.frozenDeposit} 到用户余额`}
                  onConfirm={() => handleReleaseDeposit(record.id)}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ loading: releasing }}
                >
                  <Button 
                    type="link" 
                    size="small" 
                    type="primary"
                    icon={<UnlockOutlined />}
                  >
                    释放押金
                  </Button>
                </Popconfirm>
              ) : record.status === 'SETTLED' ? (
                <Popconfirm
                  title="确定要强制释放押金吗？"
                  description="违章观察期尚未结束，确认要强制释放押金？"
                  onConfirm={() => handleForceReleaseDeposit(record.id)}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true, loading: releasing }}
                >
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    icon={<ExportOutlined />}
                  >
                    强制释放
                  </Button>
                </Popconfirm>
              ) : null}
            </>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await rentalApi.getAll();
      if (response.data.success) {
        const allOrders = response.data.data;
        setOrders(allOrders);
        
        let totalFrozen = 0;
        let inObservation = 0;
        let readyToRelease = 0;
        
        allOrders.forEach(order => {
          if (order.depositReleased) return;
          
          const remaining = order.remainingDeposit !== null && order.remainingDeposit !== undefined 
            ? order.remainingDeposit 
            : order.frozenDeposit;
          
          if (remaining > 0) {
            totalFrozen += remaining;
            
            if (order.violationObservationEndTime && order.status === 'SETTLED') {
              const isOver = isObservationOver(order);
              if (isOver) {
                readyToRelease += remaining;
              } else {
                inObservation++;
              }
            }
          }
        });
        
        setStats({
          totalFrozen,
          inObservation,
          readyToRelease,
        });
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseDeposit = async (orderId) => {
    try {
      setReleasing(true);
      const response = await depositApi.release(orderId);
      if (response.data.success) {
        message.success('押金释放成功');
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('释放押金失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setReleasing(false);
    }
  };

  const handleForceReleaseDeposit = async (orderId) => {
    try {
      setReleasing(true);
      const response = await depositApi.forceRelease(orderId);
      if (response.data.success) {
        message.success('押金强制释放成功');
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('强制释放押金失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setReleasing(false);
    }
  };

  const showDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const getOrdersWithDeposit = () => {
    return orders.filter(order => 
      order.status === 'RETURNED' || 
      order.status === 'SETTLED' ||
      order.status === 'PICKED_UP'
    );
  };

  return (
    <div>
      <Card
        title={<span><SafetyOutlined /> 押金管理</span>}
        extra={
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新
          </Button>
        }
      >
        <Alert
          message="押金管理说明"
          description={
            <div>
              <p><strong>押金冻结规则：</strong>用户租车时，冻结押金 + 预计租金</p>
              <p><strong>还车结算：</strong>按实际天数、超里程、油量差、损坏计算费用</p>
              <p><strong>违章观察期：</strong>还车后进入7天违章观察期，押金不立即释放</p>
              <p><strong>违章处理：</strong>违章导入后，从押金中扣除罚款</p>
              <p><strong>押金释放：</strong>观察期结束后，定时任务自动释放剩余押金到用户余额</p>
              <p><strong>手动释放：</strong>可手动释放已结算且观察期结束的订单押金，也可强制释放（不推荐）</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="冻结押金总额"
                value={stats.totalFrozen}
                prefix="¥"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="观察期中订单"
                value={stats.inObservation}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="待释放押金"
                value={stats.readyToRelease}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider>押金相关订单</Divider>
        
        <Alert
          message="操作说明"
          description={
            <div>
              <p><strong>释放押金：</strong>仅适用于已结算且观察期已结束的订单</p>
              <p><strong>强制释放：</strong>可在观察期未结束时释放，但不建议使用</p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          columns={columns}
          dataSource={getOrdersWithDeposit()}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
        />

        <Divider>押金管理流程图</Divider>
        
        <div style={{ 
          background: '#fafafa', 
          padding: '24px', 
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-around',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center', margin: '8px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#e6f7ff', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <CarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            </div>
            <div style={{ fontWeight: 'bold' }}>1. 租车</div>
            <div style={{ fontSize: '12px', color: '#666' }}>冻结押金+租金</div>
          </div>
          
          <div style={{ textAlign: 'center', margin: '8px', marginTop: '30px' }}>
            →
          </div>
          
          <div style={{ textAlign: 'center', margin: '8px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#fff7e6', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#fa8c16' }} />
            </div>
            <div style={{ fontWeight: 'bold' }}>2. 还车</div>
            <div style={{ fontSize: '12px', color: '#666' }}>结算费用</div>
          </div>
          
          <div style={{ textAlign: 'center', margin: '8px', marginTop: '30px' }}>
            →
          </div>
          
          <div style={{ textAlign: 'center', margin: '8px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#fff1f0', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#f5222d' }} />
            </div>
            <div style={{ fontWeight: 'bold' }}>3. 违章观察</div>
            <div style={{ fontSize: '12px', color: '#666' }}>7天观察期</div>
          </div>
          
          <div style={{ textAlign: 'center', margin: '8px', marginTop: '30px' }}>
            →
          </div>
          
          <div style={{ textAlign: 'center', margin: '8px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#f6ffed', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <SafetyOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
            </div>
            <div style={{ fontWeight: 'bold' }}>4. 押金释放</div>
            <div style={{ fontSize: '12px', color: '#666' }}>定时任务/手动释放</div>
          </div>
        </div>

        <Divider>定时任务说明</Divider>
        
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Card title="押金释放定时任务" size="small">
              <p><strong>执行频率：</strong>每小时执行一次（0 0 * * * ?）</p>
              <p><strong>执行条件：</strong></p>
              <ul>
                <li>订单状态为 SETTLED（已结算）</li>
                <li>违章观察期已结束</li>
                <li>押金尚未释放</li>
              </ul>
              <p><strong>执行动作：</strong></p>
              <ul>
                <li>将剩余押金释放到用户余额</li>
                <li>标记订单押金已释放</li>
              </ul>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card title="手动释放说明" size="small">
              <p><strong>正常释放：</strong></p>
              <ul>
                <li>订单状态必须为 SETTLED（已结算）</li>
                <li>违章观察期必须已结束</li>
                <li>推荐使用方式</li>
              </ul>
              <p><strong>强制释放：</strong></p>
              <ul>
                <li>不检查观察期状态</li>
                <li>可能导致未检测到的违章无法扣款</li>
                <li>请谨慎使用</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="押金订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={650}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号" span={2}>{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="用户">{selectedOrder.user?.realName}</Descriptions.Item>
              <Descriptions.Item label="车辆">
                {selectedOrder.car?.brand} {selectedOrder.car?.model} ({selectedOrder.car?.plateNumber})
              </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag color={orderStatusColors[selectedOrder.status]}>
                  {orderStatusNames[selectedOrder.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="还车时间">
                {selectedOrder.actualReturnTime 
                  ? dayjs(selectedOrder.actualReturnTime).format('YYYY-MM-DD HH:mm:ss') 
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="冻结押金" style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                ¥{selectedOrder.frozenDeposit}
              </Descriptions.Item>
              <Descriptions.Item label="剩余押金" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                ¥{selectedOrder.remainingDeposit !== null && selectedOrder.remainingDeposit !== undefined 
                    ? selectedOrder.remainingDeposit 
                    : selectedOrder.frozenDeposit}
              </Descriptions.Item>
              <Descriptions.Item label="违章观察截止">
                {selectedOrder.violationObservationEndTime 
                  ? dayjs(selectedOrder.violationObservationEndTime).format('YYYY-MM-DD HH:mm:ss') 
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="押金状态">
                {selectedOrder.depositReleased 
                  ? <Tag color="green">已释放</Tag> 
                  : <Tag color="orange">未释放</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Divider>费用明细</Divider>
            
            {selectedOrder.status === 'RETURNED' || selectedOrder.status === 'SETTLED' ? (
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="租金">¥{selectedOrder.totalRent || 0}</Descriptions.Item>
                <Descriptions.Item label="超里程费">¥{selectedOrder.mileageFee || 0}</Descriptions.Item>
                <Descriptions.Item label="油费差额">¥{selectedOrder.fuelFee || 0}</Descriptions.Item>
                <Descriptions.Item label="逾期费">¥{selectedOrder.overdueFee || 0}</Descriptions.Item>
                <Descriptions.Item label="损坏费">¥{selectedOrder.damageFee || 0}</Descriptions.Item>
                <Descriptions.Item label="保险赔付">¥{selectedOrder.insuranceCoverage || 0}</Descriptions.Item>
                <Descriptions.Item 
                  label="应付总额" 
                  span={2} 
                  style={{ color: '#f5222d', fontWeight: 'bold' }}
                >
                  ¥{selectedOrder.totalAmount || 0}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert message="订单尚未还车，无费用明细" type="info" />
            )}

            <Divider>操作区域</Divider>
            
            {canReleaseDeposit(selectedOrder) && (
              <Space>
                {selectedOrder.status === 'SETTLED' && isObservationOver(selectedOrder) ? (
                  <Popconfirm
                    title="确定要手动释放押金吗？"
                    description={`将释放剩余押金 ¥${selectedOrder.remainingDeposit !== null && selectedOrder.remainingDeposit !== undefined ? selectedOrder.remainingDeposit : selectedOrder.frozenDeposit} 到用户余额`}
                    onConfirm={() => {
                      handleReleaseDeposit(selectedOrder.id);
                      setDetailModalVisible(false);
                    }}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="primary" icon={<UnlockOutlined />}>
                      释放押金
                    </Button>
                  </Popconfirm>
                ) : selectedOrder.status === 'SETTLED' ? (
                  <Popconfirm
                    title="确定要强制释放押金吗？"
                    description="违章观察期尚未结束，确认要强制释放押金？"
                    onConfirm={() => {
                      handleForceReleaseDeposit(selectedOrder.id);
                      setDetailModalVisible(false);
                    }}
                    okText="确定"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<ExportOutlined />}>
                      强制释放押金
                    </Button>
                  </Popconfirm>
                ) : (
                  <Alert 
                    message="订单尚未结算，无法释放押金" 
                    type="warning" 
                    showIcon 
                  />
                )}
              </Space>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepositManagement;
