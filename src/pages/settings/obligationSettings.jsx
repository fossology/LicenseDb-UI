// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2024 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import React, { useState } from 'react';
import { Form, Row, Col, CloseButton } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import '../../styles/settings.css';
import { SketchPicker } from 'react-color';
import {
	useQuery,
	useMutation,
	keepPreviousData,
	useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
	fetchObligationTypes,
	postObligationType,
	deleteObligationType,
	fetchObligationClassfications,
	postObligationClassification,
	deleteObligationClassification,
	postObligationCategory,
	fetchObligationCategories,
	deleteObligationCategory
} from '../../api/api';

function ObligationSettings() {
	const [newType, setNewType] = useState('');
	const [typeIndex, setTypeIndex] = useState(null);
	const [newCategory, setNewCategory] = useState('');
	const [categoryIndex, setCategoryIndex] = useState(null);
	const [classIndex, setClassIndex] = useState(null);
	const [color, setColor] = useState('#fff');
	const [colorName, setColorName] = useState('');
	const [isPickerVisible, setIsPickerVisible] = useState(false);

	const queryClient = useQueryClient();

	// obligation type queries and mutations
	const { data: obligationTypesData } = useQuery({
		queryKey: ['obligationTypes'],
		queryFn: () => fetchObligationTypes(),
		placeholderData: keepPreviousData,
	});

	const createType = useMutation({
		mutationFn: postObligationType,
		onError: error => {
			toast.error(
				`Obligation type creation failed: ${error.response.data.error}`,
				{
					position: 'top-right',
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				},
			);
		},
		onSuccess: () => {
			toast.success('Obligation type created successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['obligationTypes']);
			queryClient.invalidateQueries('audits');
		},
	});

	const deleteType = useMutation({
		mutationFn: deleteObligationType,
		onError: error => {
			toast.error(
				`Obligation type deletion failed: ${error.response.data.error}`,
				{
					position: 'top-right',
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				},
			);
		},
		onSuccess: () => {
			toast.success('Obligation type deleted successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['obligationTypes']);
			queryClient.invalidateQueries('audits');
		},
	});

	// obligation category queries and mutations
	const { data: obligationCategoriesData } = useQuery({
		queryKey: ['obligationCategory'],
		queryFn: () => fetchObligationCategories(),
		placeholderData: keepPreviousData,
	});

	const createCategory = useMutation({
		mutationFn: postObligationCategory,
		onError: error => {
			toast.error(
				`Obligation category creation failed: ${error.response.data.error}`,
				{
					position: 'top-right',
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				},
			);
		},
		onSuccess: () => {
			toast.success('Obligation category created successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['obligationCategory']);
			queryClient.invalidateQueries('audits');
		},
	});

	const deleteCategory = useMutation({
		mutationFn: deleteObligationCategory,
		onError: error => {
			toast.error(
				`Obligation category deletion failed: ${error.response.data.error}`,
				{
					position: 'top-right',
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				},
			);
		},
		onSuccess: () => {
			toast.success('Obligation category deleted successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['obligationCategory']);
			queryClient.invalidateQueries('audits');
		},
	});

	// obligation classification queries and mutations
	const { data: obligationClassificationsData } = useQuery({
		queryKey: ['obligationClassifications'],
		queryFn: () => fetchObligationClassfications(),
		placeholderData: keepPreviousData,
	});

	const createClassification = useMutation({
		mutationFn: postObligationClassification,
		onError: error => {
			toast.error(
				`Obligation classification creation failed: ${error.response.data.error}`,
				{
					position: 'top-right',
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				},
			);
		},
		onSuccess: data => {
			toast.success('Obligation classification created successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['obligationClassifications']);
			queryClient.invalidateQueries('audits');
		},
	});

	const deleteClassification = useMutation({
		mutationFn: deleteObligationClassification,
		onError: error => {
			toast.error(
				`Obligation classification deletion failed: ${error.response.data.message}`,
				{
					position: 'top-right',
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				},
			);
		},
		onSuccess: data => {
			toast.success('Obligation deleteClass deleted successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['obligationClassifications']);
			queryClient.invalidateQueries('audits');
		},
	});

	return (
		<div className="content mt-3">
			<Form
				className="create-form-parent mb-2"
				onSubmit={e => {
					e.preventDefault();
					createType.mutate({ payload: { type: newType } });
					setNewType('');
				}}
			>
				<Row>
					<Col style={{ borderRight: '1px dashed gray' }}>
						<Form.Group className="form-fields">
							<Form.Label>Add new obligation Type</Form.Label>
							<Form.Control
								type="text"
								name="type"
								value={newType}
								onChange={e =>
									setNewType(e.target.value.toUpperCase())
								}
								placeholder="Enter type name"
							/>
						</Form.Group>
						<Button
							type="submit"
							variant="primary"
							disabled={createType.isPending}
						>
							Add Type
						</Button>
					</Col>
					<Col>
						<h6>Obligation types list</h6>
						<div className="ms-4">
							{obligationTypesData?.data?.map((option, index) => (
								<li
									key={index}
									onMouseEnter={() => setTypeIndex(index)}
									onMouseLeave={() => setTypeIndex(null)}
								>
									{option.type}
									{typeIndex === index && (
										<CloseButton
											style={{
												marginLeft: '0.8rem',
												marginTop: '0',
											}}
											type="button"
											onClick={() =>
												deleteType.mutate(option)
											}
											className="btn-close pt-0 pb-0"
											aria-label="Close"
										/>
									)}
								</li>
							))}
						</div>
					</Col>
				</Row>
			</Form>
			<Form
				className="create-form-parent mb-2"
				onSubmit={e => {
					e.preventDefault();
					createCategory.mutate({ payload: { category: newCategory } });
					setNewCategory('');
				}}
			>
				<Row>
					<Col style={{ borderRight: '1px dashed gray' }}>
						<Form.Group className="form-fields">
							<Form.Label>Add new obligation Category</Form.Label>
							<Form.Control
								type="text"
								name="category"
								value={newCategory}
								onChange={e =>
									setNewCategory(e.target.value.toUpperCase())
								}
								placeholder="Enter category name"
							/>
						</Form.Group>
						<Button
							type="submit"
							variant="primary"
							disabled={createCategory.isPending}
						>
							Add Category
						</Button>
					</Col>
					<Col>
						<h6>Obligation categories list</h6>
						<div className='ms-4'>
							{obligationCategoriesData?.data?.map((option, index) => (
								<li
									key={index}
									onMouseEnter={() => setCategoryIndex(index)}
									onMouseLeave={() => setCategoryIndex(null)}
								>
									{option.category}
									{categoryIndex === index && (
										<CloseButton
											style={{
												marginLeft: '0.8rem',
												marginTop: '0',
											}}
											type="button"
											onClick={() =>
												deleteCategory.mutate(option)
											}
											className="btn-close pt-0 pb-0"
											aria-label="Close"
										/>
									)}
								</li>
							))}
						</div>
					</Col>
				</Row>
			</Form>
			<Form
				className="create-form-parent"
				onSubmit={e => {
					e.preventDefault();
					setIsPickerVisible(false);
					setColor('#fff');
					setColorName('');
					createClassification.mutate({
						payload: { classification: colorName, color: color },
					});
				}}
			>
				<Row>
					<Col style={{ borderRight: '1px dashed gray' }}>
						<Row>
							<Col>
								<Form.Group className="form-fields">
									<Form.Label>
										Pick a Color for the Classification
									</Form.Label>
									<div
										style={{
											display: 'flex',
											flexFlow: 'row',
										}}
									>
										<Form.Control
											type="text"
											value={color}
											onClick={() =>
												setIsPickerVisible(
													!isPickerVisible,
												)
											}
											readOnly
											style={{
												width: '75%',
												marginRight: '8px',
												cursor: 'pointer',
											}}
										/>
										<div
											className="color-block"
											style={{ backgroundColor: color }}
										/>
									</div>
									{isPickerVisible && (
										<SketchPicker
											color={color}
											onChangeComplete={color => {
												setColor(color.hex);
											}}
											closePicker={() =>
												setIsPickerVisible(false)
											}
										/>
									)}
								</Form.Group>
							</Col>
							<Col>
								<Form.Group>
									<Form.Label>Classification Name</Form.Label>
									<Form.Control
										type="text"
										name="topic"
										value={colorName}
										onChange={e =>
											setColorName(
												e.target.value.toUpperCase(),
											)
										}
										placeholder="Enter color"
									/>
								</Form.Group>
							</Col>
						</Row>
						<Button type="submit" variant="primary">
							Add Classification
						</Button>
					</Col>
					<Col>
						<div className="">
							<h6>Obligation classification list</h6>
							<ul>
								{obligationClassificationsData?.data?.map(
									(option, index) => (
										<li
											key={index}
											onMouseEnter={() =>
												setClassIndex(index)
											}
											onMouseLeave={() =>
												setClassIndex(null)
											}
										>
											<Row>
												<Col className="col-md-8">
													<Row>
														<Col className="col-md-4">
															<b>Name: </b>{' '}
															{
																option.classification
															}
														</Col>
														<Col className="col-md-4">
															<b>Color: </b>{' '}
															{option.color}
														</Col>
														<Col className="col-md-2">
															<div
																className="color-block"
																style={{
																	backgroundColor:
																		option.color,
																	width: '100%',
																}}
															/>
														</Col>
														<Col className="col-md-2">
															{classIndex ===
																index && (
																<CloseButton
																	style={{
																		marginLeft:
																			'0.8rem',
																		marginTop:
																			'0',
																	}}
																	type="button"
																	onClick={() =>
																		deleteClassification.mutate(
																			{
																				classification:
																					option.classification,
																			},
																		)
																	}
																	className="btn-close pt-0 pb-0"
																	aria-label="Close"
																/>
															)}
														</Col>
													</Row>
												</Col>
											</Row>
										</li>
									),
								)}
							</ul>
						</div>
					</Col>
				</Row>
			</Form>
		</div>
	);
}

export default ObligationSettings;
