import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, 
  message, Space, Popconfirm, Tabs, Descriptions, Divider, List 
} from 'antd';
import { 
  PlusOutlined, ReloadOutlined, FileTextOutlined, CarOutlined,
  CalendarOutlined, CheckCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { rentalApi, carApi, userApi } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

const RentalManagement = () => {
  const [rentals, setRentals] = useState([]);
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const [reserveModalVisible, setReserveModalVisible] = useState(false);
  const [pickupModalVisible, setPickupModalVisible] = useState(false);
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reserveForm] = Form.useForm();
  const [pickupForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [damageList, setDamageList] = useState([]);

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

  const creditLevelNames = {
    EXCELLENT: '优秀',
    GOOD: '良好',
    FAIR: '一般',
    POOR: '较差',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={orderStatusColors[status]}>
          {orderStatusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '预订时间',
      dataIndex: 'reservationTime',
      key: 'reservationTime',
      render: (time) => time && dayjs(time).format('MM-DD HH:mm'),
      width: 120,
    },
    {
      title: '预计天数',
      dataIndex: 'expectedDays',
      key: 'expectedDays',
      render: (days) => `${days}天`,
    },
    {
      title: '日租金',
      dataIndex: 'dailyRent',
      key: 'dailyRent',
      render: (rent) => `¥${rent}`,
    },
    {
      title: '保险',
      dataIndex: 'hasInsurance',
      key: 'hasInsurance',
      render: (has) => has ? <Tag color="green">已购买</Tag> : <Tag color="default">未购买</Tag>,
    },
    {
      title: '冻结押金',
      dataIndex: 'frozenDeposit',
      key: 'frozenDeposit',
      render: (deposit) => `¥${deposit}`,
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
          {record.status === 'RESERVED' && (
            <Button 
              type="link" 
              size="small"
              type="primary"
              onClick={() => showPickup(record)}
            >
              取车
            </Button>
          )}
          {record.status === 'PICKED_UP' && (
            <Button 
              type="link" 
              size="small"
              type="primary"
              onClick={() => showReturn(record)}
            >
              还车
            </Button>
          )}
          {record.status === 'RETURNED' && (
            <Popconfirm
              title="确定要结算此订单吗？"
              onConfirm={() => handleSettle(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" type="primary">
                结算
              </Button>
            </Popconfirm>
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
      const [usersRes, carsRes, rentalsRes] = await Promise.all([
        userApi.getAll(),
        carApi.getAll(),
        rentalApi.getAll(),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (carsRes.data.success) setCars(carsRes.data.data);
      if (rentalsRes.data.success) setRentals(rentalsRes.data.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const showReserve = () => {
    reserveForm.resetFields();
    setReserveModalVisible(true);
  };

  const showPickup = (order) => {
    setSelectedOrder(order);
    pickupForm.resetFields();
    pickupForm.setFieldsValue({
      orderId: order.id,
      pickupMileage: order.car?.mileage,
      pickupFuelLevel: order.car?.fuelLevel,
    });
    setPickupModalVisible(true);
  };

  const showReturn = (order) => {
    setSelectedOrder(order);
    returnForm.resetFields();
    setDamageList([]);
    returnForm.setFieldsValue({
      orderId: order.id,
      returnMileage: order.pickupMileage + 100,
      returnFuelLevel: order.pickupFuelLevel,
    });
    setReturnModalVisible(true);
  };

  const showDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleReserve = async (values) => {
    try {
      const response = await rentalApi.reserve({
        ...values,
        pickupTime: values.pickupTime ? dayjs(values.pickupTime).toISOString() : null,
      });
      if (response.data.success) {
        message.success('预订成功');
        setReserveModalVisible(false);
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('预订失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handlePickup = async (values) => {
    try {
      const response = await rentalApi.pickup(values);
      if (response.data.success) {
        message.success('取车成功');
        setPickupModalVisible(false);
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('取车失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReturn = async (values) => {
    try {
      const submitData = {
        ...values,
        damages: damageList.length > 0 ? damageList : null,
      };
      const response = await rentalApi.returnCar(submitData);
      if (response.data.success) {
        message.success('还车成功');
        setReturnModalVisible(false);
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('还车失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSettle = async (orderId) => {
    try {
      const response = await rentalApi.settle(orderId);
      if (response.data.success) {
        message.success('结算成功');
        loadData();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('结算失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const addDamage = () => {
    setDamageList([...damageList, {
      type: 'BODY_DAMAGE',
      location: '',
      description: '',
      level: 'MINOR',
      estimatedCost: 0,
    }]);
  };

  const updateDamage = (index, field, value) => {
    const newList = [...damageList];
    newList[index][field] = value;
    setDamageList(newList);
  };

  const removeDamage = (index) => {
    const newList = [...damageList];
    newList.splice(index, 1);
    setDamageList(newList);
  };

  const filteredRentals = rentals;

  return (
    <div>
      <Card
        title={<span><FileTextOutlined /> 租赁管理</span>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={showReserve}>
              预订车辆
            </Button>
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <TabPane tab="全部订单" key="all" />
        </Tabs>
        
        <Table
          columns={columns}
          dataSource={filteredRentals}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1400 }}
        />
      </Card>

      <Modal
        title="预订车辆"
        open={reserveModalVisible}
        onCancel={() => setReserveModalVisible(false)}
        onOk={() => reserveForm.submit()}
        width={500}
      >
        <Form
          form={reserveForm}
          layout="vertical"
          onFinish={handleReserve}
        >
          <Form.Item
            name="userId"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select placeholder="请选择用户">
              {users.filter(u => !u.isBlacklisted).map(user => (
                <Option key={user.id} value={user.id}>
                  {user.realName} - 余额: ¥{user.balance} - 信用: {creditLevelNames[user.creditLevel]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="carId"
            label="选择车辆"
            rules={[{ required: true, message: '请选择车辆' }]}
          >
            <Select placeholder="请选择车辆">
              {cars.filter(c => c.status === 'AVAILABLE').map(car => (
                <Option key={car.id} value={car.id}>
                  {car.plateNumber} - {car.brand} {car.model} - ¥{car.dailyRent}/天 - 押金¥{car.deposit}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="expectedDays"
            label="租车天数"
            rules={[{ required: true, message: '请输入租车天数' }]}
          >
            <InputNumber min={1} max={30} style={{ width: '100%' }} placeholder="请输入租车天数" />
          </Form.Item>
          <Form.Item
            name="hasInsurance"
            label="是否购买保险"
            rules={[{ required: true, message: '请选择' }]}
          >
            <Select placeholder="是否购买保险（每天30元）">
              <Option value={true}>是（每天30元，80%损坏赔付）</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="取车确认"
        open={pickupModalVisible}
        onCancel={() => setPickupModalVisible(false)}
        onOk={() => pickupForm.submit()}
        width={500}
      >
        <Descriptions bordered column={1} size="small" style={{ marginBottom: '16px' }}>
          <Descriptions.Item label="订单号">{selectedOrder?.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="用户">{selectedOrder?.user?.realName}</Descriptions.Item>
          <Descriptions.Item label="车辆">
            {selectedOrder?.car?.brand} {selectedOrder?.car?.model} ({selectedOrder?.car?.plateNumber})
          </Descriptions.Item>
        </Descriptions>
        <Form
          form={pickupForm}
          layout="vertical"
          onFinish={handlePickup}
        >
          <Form.Item name="orderId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="pickupMileage"
            label="取车时里程(km)"
            rules={[{ required: true, message: '请输入里程' }]}
          >
            <InputNumber min={0} precision={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="pickupFuelLevel"
            label="取车时油量(%)"
            rules={[{ required: true, message: '请输入油量' }]}
          >
            <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="取车备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="还车检查"
        open={returnModalVisible}
        onCancel={() => setReturnModalVisible(false)}
        onOk={() => returnForm.submit()}
        width={600}
      >
        <Descriptions bordered column={1} size="small" style={{ marginBottom: '16px' }}>
          <Descriptions.Item label="订单号">{selectedOrder?.orderNumber}</Descriptions.Item>
          <Descriptions.Item label="取车时里程">{selectedOrder?.pickupMileage} km</Descriptions.Item>
          <Descriptions.Item label="取车时油量">{selectedOrder?.pickupFuelLevel}%</Descriptions.Item>
          <Descriptions.Item label="保险">{selectedOrder?.hasInsurance ? '已购买（80%赔付）' : '未购买'}</Descriptions.Item>
        </Descriptions>
        <Form
          form={returnForm}
          layout="vertical"
          onFinish={handleReturn}
        >
          <Form.Item name="orderId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="returnMileage"
            label="还车时里程(km)"
            rules={[{ required: true, message: '请输入里程' }]}
          >
            <InputNumber min={0} precision={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="returnFuelLevel"
            label="还车时油量(%)"
            rules={[{ required: true, message: '请输入油量' }]}
          >
            <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Divider>车辆损坏检查</Divider>
          
          <Button type="dashed" onClick={addDamage} block style={{ marginBottom: '16px' }}>
            + 添加损坏记录
          </Button>
          
          {damageList.map((damage, index) => (
            <Card 
              key={index} 
              size="small" 
              style={{ marginBottom: '8px' }}
              extra={
                <Button type="link" danger size="small" onClick={() => removeDamage(index)}>
                  删除
                </Button>
              }
            >
              <Form layout="inline">
                <Form.Item label="类型">
                  <Select 
                    value={damage.type} 
                    onChange={(v) => updateDamage(index, 'type', v)}
                    style={{ width: 100 }}
                  >
                    <Option value="BODY_DAMAGE">车身</Option>
                    <Option value="MECHANICAL">机械</Option>
                    <Option value="ELECTRICAL">电器</Option>
                    <Option value="INTERIOR">内饰</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="位置">
                  <Input 
                    value={damage.location} 
                    onChange={(e) => updateDamage(index, 'location', e.target.value)}
                    placeholder="位置"
                    style={{ width: 100 }}
                  />
                </Form.Item>
                <Form.Item label="程度">
                  <Select 
                    value={damage.level} 
                    onChange={(v) => updateDamage(index, 'level', v)}
                    style={{ width: 80 }}
                  >
                    <Option value="MINOR">轻微</Option>
                    <Option value="MODERATE">中等</Option>
                    <Option value="SEVERE">严重</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="预估费用">
                  <InputNumber 
                    value={damage.estimatedCost} 
                    onChange={(v) => updateDamage(index, 'estimatedCost', v)}
                    min={0}
                    precision={2}
                    style={{ width: 100 }}
                  />
                </Form.Item>
              </Form>
              <Input.TextArea 
                value={damage.description}
                onChange={(e) => updateDamage(index, 'description', e.target.value)}
                placeholder="损坏描述"
                size="small"
                style={{ marginTop: '8px' }}
              />
            </Card>
          ))}
          
          <Form.Item name="remark" label="还车备注">
            <Input.TextArea rows={2} placeholder="还车备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="订单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号" span={2}>{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={orderStatusColors[selectedOrder.status]}>
                  {orderStatusNames[selectedOrder.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用户">{selectedOrder.user?.realName}</Descriptions.Item>
              <Descriptions.Item label="车辆" span={2}>
                {selectedOrder.car?.brand} {selectedOrder.car?.model} ({selectedOrder.car?.plateNumber})
              </Descriptions.Item>
              <Descriptions.Item label="预订时间">{selectedOrder.reservationTime}</Descriptions.Item>
              <Descriptions.Item label="取车时间">{selectedOrder.pickupTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="预计还车">{selectedOrder.expectedReturnTime}</Descriptions.Item>
              <Descriptions.Item label="实际还车">{selectedOrder.actualReturnTime || '-'}</Descriptions.Item>
              <Descriptions.Item label="预计天数">{selectedOrder.expectedDays}天</Descriptions.Item>
              <Descriptions.Item label="实际天数">{selectedOrder.actualDays || '-'}天</Descriptions.Item>
              <Descriptions.Item label="日租金">¥{selectedOrder.dailyRent}</Descriptions.Item>
              <Descriptions.Item label="保险">{selectedOrder.hasInsurance ? '已购买' : '未购买'}</Descriptions.Item>
              <Descriptions.Item label="取车里程">{selectedOrder.pickupMileage || '-'} km</Descriptions.Item>
              <Descriptions.Item label="还车里程">{selectedOrder.returnMileage || '-'} km</Descriptions.Item>
              <Descriptions.Item label="取车油量">{selectedOrder.pickupFuelLevel || '-'}%</Descriptions.Item>
              <Descriptions.Item label="还车油量">{selectedOrder.returnFuelLevel || '-'}%</Descriptions.Item>
            </Descriptions>
            
            {(selectedOrder.status === 'RETURNED' || selectedOrder.status === 'SETTLED') && (
              <>
                <Divider>费用明细</Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="租金">¥{selectedOrder.totalRent || 0}</Descriptions.Item>
                  <Descriptions.Item label="超里程费">¥{selectedOrder.mileageFee || 0}</Descriptions.Item>
                  <Descriptions.Item label="油费差额">¥{selectedOrder.fuelFee || 0}</Descriptions.Item>
                  <Descriptions.Item label="逾期费">¥{selectedOrder.overdueFee || 0}</Descriptions.Item>
                  <Descriptions.Item label="损坏费">¥{selectedOrder.damageFee || 0}</Descriptions.Item>
                  <Descriptions.Item label="保险赔付">¥{selectedOrder.insuranceCoverage || 0}</Descriptions.Item>
                  <Descriptions.Item label="应付总额" span={2} style={{ fontWeight: 'bold', color: '#f5222d' }}>
                    ¥{selectedOrder.totalAmount || 0}
                  </Descriptions.Item>
                </Descriptions>
                
                <Divider>押金信息</Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="冻结押金">¥{selectedOrder.frozenDeposit || 0}</Descriptions.Item>
                  <Descriptions.Item label="剩余押金">¥{selectedOrder.remainingDeposit || 0}</Descriptions.Item>
                  <Descriptions.Item label="违章观察截止">
                    {selectedOrder.violationObservationEndTime || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="押金是否释放">
                    {selectedOrder.depositReleased ? '已释放' : '未释放'}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RentalManagement;
