import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Modal, Form, Input, Select, InputNumber, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, ReloadOutlined, CarOutlined } from '@ant-design/icons';
import { carApi } from '../services/api';

const { Option } = Select;

const CarManagement = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const carTypeNames = {
    ECONOMY: '经济型',
    COMPACT: '紧凑型',
    SUV: 'SUV',
    LUXURY: '豪华型',
    COMMERCIAL: '商务型',
  };

  const carStatusNames = {
    AVAILABLE: '可用',
    RESERVED: '已预订',
    RENTED: '租用中',
    MAINTENANCE: '维护中',
    DAMAGED: '损坏',
  };

  const carStatusColors = {
    AVAILABLE: 'green',
    RESERVED: 'orange',
    RENTED: 'blue',
    MAINTENANCE: 'red',
    DAMAGED: 'red',
  };

  const columns = [
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '车型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag>{carTypeNames[type] || type}</Tag>,
    },
    {
      title: '日租金',
      dataIndex: 'dailyRent',
      key: 'dailyRent',
      render: (rent) => `¥${rent}`,
    },
    {
      title: '押金',
      dataIndex: 'deposit',
      key: 'deposit',
      render: (deposit) => `¥${deposit}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={carStatusColors[status]}>
          {carStatusNames[status] || status}
        </Tag>
      ),
    },
    {
      title: '里程(km)',
      dataIndex: 'mileage',
      key: 'mileage',
    },
    {
      title: '油量(%)',
      dataIndex: 'fuelLevel',
      key: 'fuelLevel',
      render: (level) => `${level}%`,
    },
    {
      title: '年份',
      dataIndex: 'productionYear',
      key: 'productionYear',
    },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
    },
  ];

  useEffect(() => {
    loadCars();
  }, []);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await carApi.getAll();
      if (response.data.success) {
        setCars(response.data.data);
      }
    } catch (error) {
      message.error('加载车辆列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const response = await carApi.create({
        ...values,
        status: 'AVAILABLE',
      });
      if (response.data.success) {
        message.success('车辆添加成功');
        setModalVisible(false);
        loadCars();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('添加车辆失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    try {
      await carApi.delete(id);
      message.success('车辆删除成功');
      loadCars();
    } catch (error) {
      message.error('删除车辆失败: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <Card
        title={<span><CarOutlined /> 车辆管理</span>}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadCars}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加车辆
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={cars}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="添加车辆"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="plateNumber"
            label="车牌号"
            rules={[{ required: true, message: '请输入车牌号' }]}
          >
            <Input placeholder="例如：京A12345" />
          </Form.Item>
          <Form.Item
            name="brand"
            label="品牌"
            rules={[{ required: true, message: '请输入品牌' }]}
          >
            <Input placeholder="例如：大众" />
          </Form.Item>
          <Form.Item
            name="model"
            label="型号"
            rules={[{ required: true, message: '请输入型号' }]}
          >
            <Input placeholder="例如：朗逸" />
          </Form.Item>
          <Form.Item
            name="type"
            label="车型"
            rules={[{ required: true, message: '请选择车型' }]}
          >
            <Select placeholder="请选择车型">
              <Option value="ECONOMY">经济型</Option>
              <Option value="COMPACT">紧凑型</Option>
              <Option value="SUV">SUV</Option>
              <Option value="LUXURY">豪华型</Option>
              <Option value="COMMERCIAL">商务型</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="dailyRent"
            label="日租金(元)"
            rules={[{ required: true, message: '请输入日租金' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="例如：150" />
          </Form.Item>
          <Form.Item
            name="deposit"
            label="押金(元)"
            rules={[{ required: true, message: '请输入押金' }]}
          >
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="例如：3000" />
          </Form.Item>
          <Form.Item
            name="mileage"
            label="里程(km)"
            rules={[{ required: true, message: '请输入里程' }]}
          >
            <InputNumber min={0} precision={1} style={{ width: '100%' }} placeholder="例如：50000" />
          </Form.Item>
          <Form.Item
            name="fuelLevel"
            label="油量(%)"
            rules={[{ required: true, message: '请输入油量' }]}
          >
            <InputNumber min={0} max={100} precision={0} style={{ width: '100%' }} placeholder="例如：100" />
          </Form.Item>
          <Form.Item
            name="productionYear"
            label="年份"
            rules={[{ required: true, message: '请输入年份' }]}
          >
            <InputNumber min={2000} max={2030} precision={0} style={{ width: '100%' }} placeholder="例如：2020" />
          </Form.Item>
          <Form.Item name="color" label="颜色">
            <Input placeholder="例如：白色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CarManagement;
