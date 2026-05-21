// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import React, { useEffect, useState } from 'react';
import {
	Row,
	Col,
	Form,
	InputGroup,
	OverlayTrigger,
	Tooltip,
} from 'react-bootstrap';
import '../styles/detailViewForm.css';
import {
	useQuery,
	useMutation,
	useQueryClient,
	keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Select from 'react-select';
import PropTypes from 'prop-types';
import { BsClipboard } from 'react-icons/bs';
import CustomSelect from '../components/customStyleSelect';
import ToolTipLabel from '../components/tooltip/tooltipLabel';
import ToolTipLegend from '../components/tooltip/tooltipLegend';
import { tooltipObligation } from '../components/tooltip/tooltips';
import { categoryOptions } from '../utils/data/dropdownOptions';
import {
	updateObligation,
	fetchLicensePreviews,
	fetchObligationTypes,
	fetchObligationClassfications,
	fetchSimilarObligations,
} from '../api/api';
import SimilarityResultList from '../components/SimilarityResultList';
import { loadYaml } from '../utils/loadYaml';
import { resolveComponentPath } from '../utils/componentPathMap';

function ObligationDetailForm({
	obligationPayload,
	setObligationPayload,
	page,
	perPage,
	sortOrder,
	setRefresh
}) {
	const queryClient = useQueryClient();
	const [similarObligations, setSimilarObligations] = useState([]);
	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			if (obligationPayload.text) {
				fetchSimilarObligations(obligationPayload.text)
					.then(res => {
						let filtered = res.data || [];
						filtered = filtered.filter(
							item => item.id !== obligationPayload.id,
						);
						setSimilarObligations(filtered);
					})
					.catch(err => {
						setSimilarObligations([]);
					});
			} else {
				setSimilarObligations([]);
			}
		}, 500); // debounce time

		return () => clearTimeout(delayDebounce);
	}, [obligationPayload.text, obligationPayload.topic]);

	const { data: obligationTypes } = useQuery({
		queryKey: ['obligations', 'type'],
		queryFn: () => fetchObligationTypes(),
		placeholderData: keepPreviousData,
	});
	const typeOptions = obligationTypes?.data.map(item => ({
		value: item.type,
		label: item.type,
	}));

	const [selectedLicenses, setSelectedLicenses] = useState([]);
	const { data: licenseData } = useQuery({
		queryKey: ['licenses', 'preview'],
		queryFn: () => fetchLicensePreviews(),
		placeholderData: keepPreviousData,
	});
	const licenseOptions = (licenseData?.licenses ?? []).map(l => ({
		value: l.id,
		label: `${l.shortname} (Id:${l.id})`,
	}));
	useEffect(() => {
		if (!obligationPayload || !licenseData) return;
		const licenseById = new Map(
			(licenseData.licenses ?? []).map(lic => [lic.id, lic]),
		);
		const defaultLicenses = (obligationPayload.license_ids ?? []).flatMap(
			id => {
				const lic = licenseById.get(id);
				if (!lic) return [];
				return [
					{
						value: lic.id,
						label: `${lic.shortname} (Id:${lic.id})`,
					},
				];
			},
		);
		setSelectedLicenses(defaultLicenses);
	}, [obligationPayload, licenseData]);

	const { data: obligationClass } = useQuery({
		queryKey: ['obligations', 'classification'],
		queryFn: () => fetchObligationClassfications(),
		placeholderData: keepPreviousData,
	});
	const classOptions = obligationClass?.data.map(item => ({
		value: item.classification,
		label: item.classification,
		color: item.color,
	}));

	const mutation = useMutation({
		mutationFn: updateObligation,
		onError: error => {
			toast.error(
				`Obligation update failed: ${error.response.data.error}`,
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
			toast.success('Obligation updated successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});

			setRefresh(prev => !prev);
			queryClient.invalidateQueries('audits');
		},
	});
	const handleInputChange = e => {
		const { name, value } = e.target;
		setObligationPayload({
			...obligationPayload,
			[name]: value,
		});
	};

	const handleCheckboxChange = e => {
		const { name } = e.target;
		setObligationPayload({
			...obligationPayload,
			[name]: !obligationPayload[name],
		});
	};

	const handleLicenseChange = associatedLicenses => {
		setObligationPayload({
			...obligationPayload,
			license_ids: [ ...associatedLicenses?.map(x => x.value), ...obligationPayload.license_ids.filter(id => !licenseData.licenses.map(l => l.id).includes(id))],
		});
	};

	const defaultClass = classOptions?.filter(
		x => x.label === obligationPayload.classification,
	)[0];
	const defaultType = typeOptions?.filter(
		x => x.value === obligationPayload.type,
	)[0];

	const handleTypeChange = type => {
		setObligationPayload({
			...obligationPayload,
			['type']: type.value,
		});
	};

	const handleSubmit = async e => {
		e.preventDefault();
		mutation.mutate({
			obligationPayload,
			id: obligationPayload.id,
		});
	};

	const handleCategoryChange = e => {
		setObligationPayload({
			...obligationPayload,
			category: e.value,
		});
	};

	const [fields, setFields] = useState([]);
	useEffect(() => {
		const fetchConfig = async () => {
			const config = await loadYaml(
				`${import.meta.env.VITE_DOMAIN_SUBDIRECTORY ? `/${import.meta.env.VITE_DOMAIN_SUBDIRECTORY}` : ''}/externalRef.yaml`,
			);
			setFields(config.obligation.fields);
		};

		fetchConfig();
	}, []);

	const handleChangeExt = e => {
		if (e && e.target) {
			const { name, value, type, checked } = e.target;
			const fieldValue = type === 'checkbox' ? checked : value;
			setObligationPayload(prevData => ({
				...prevData,
				external_ref: {
					...prevData.external_ref,
					[name]: fieldValue,
				},
			}));
		} else {
			const { name, value } = e.target;
			setObligationPayload(prevData => ({
				...prevData,
				external_ref: {
					...prevData.external_ref,
					[name]: value,
				},
			}));
		}
	};

	const renderFormField = field => {
		const { formComponentPath, name, componentType, label } = field;
		const Component = resolveComponentPath(formComponentPath);

		return (
			<Row key={name}>
				<Col>
					<Form.Group
						className={`form-fields form-group-${componentType}`}
					>
						<React.Suspense fallback={<div>Loading...</div>}>
							<Component
								label={label}
								name={name}
								value={
									obligationPayload.external_ref[name] || ''
								}
								checked={
									componentType === 'checkbox'
										? obligationPayload.external_ref[
												name
											] || false
										: undefined
								}
								onChange={handleChangeExt}
							/>
						</React.Suspense>
					</Form.Group>
				</Col>
			</Row>
		);
	};

	return (
		<div className="detail-form-parent mb-5 shadow-sm">
			<Form className="obligation-form" onSubmit={handleSubmit}>
				<Row>
					<Col>
						<Row>
							<Col>
								<Row>
									<Form.Group className="form-group-text">
										<Form.Label>
											<ToolTipLabel
												label={'Obligation Id'}
												tooltipText={'Obligation Id'}
											/>
										</Form.Label>
										<InputGroup>
											<Form.Control
												type="text"
												placeholder="Obligation topic"
												name="topic"
												value={obligationPayload.id}
												onChange={handleInputChange}
												readOnly
												disabled
											/>
											<OverlayTrigger
												overlay={
													<Tooltip>{'Copy'}</Tooltip>
												}
											>
												<InputGroup.Text
													onClick={() => {
														navigator.clipboard.writeText(
															obligationPayload.id,
														);
													}}
												>
													<BsClipboard />
												</InputGroup.Text>
											</OverlayTrigger>
										</InputGroup>
									</Form.Group>
								</Row>
								<Row>
									<Form.Group className="form-group-text">
										<Form.Label>
											<ToolTipLabel
												label={'Obligation/Risk Topic'}
												tooltipText={
													'Obligation or Risk Topic'
												}
											/>
										</Form.Label>
										<Form.Control
											type="text"
											placeholder="Obligation topic"
											name="topic"
											value={obligationPayload.topic}
											onChange={handleInputChange}
										/>
									</Form.Group>
								</Row>
								<Row>
									<Form.Group className="form-group-text">
										<Form.Label>
											<ToolTipLabel
												label={'Associated Licenses'}
												tooltipText={
													'Associated Licenses'
												}
											/>
										</Form.Label>
										<Select
											options={licenseOptions}
											value={selectedLicenses}
											isSearchable
											closeMenuOnSelect={false}
											isMulti
											onChange={handleLicenseChange}
										/>
									</Form.Group>
								</Row>
								<Row className="d-flex justify-content-between">
									<Col>
										<Form.Group className="form-group-text">
											<Form.Label>
												<ToolTipLegend
													tooltip={tooltipObligation}
													label={'Classification'}
												/>
											</Form.Label>
											{classOptions && (
												<CustomSelect
													options={classOptions}
													selectedValue={defaultClass}
													name="classification"
													payload={obligationPayload}
													setPayload={
														setObligationPayload
													}
												/>
											)}
										</Form.Group>
									</Col>
									<Col>
										<Form.Group className="form-fields">
											<ToolTipLabel
												label={'Category'}
												tooltipText={'Category'}
											/>
											<Select
												value={
													categoryOptions.filter(
														elem =>
															elem.value ===
															obligationPayload.category,
													)[0]
												}
												options={categoryOptions}
												name="category"
												onChange={handleCategoryChange}
												required
											/>
										</Form.Group>
									</Col>
								</Row>
								<Row>
									<Form.Group className="form-group-text">
										<Form.Label>
											<ToolTipLabel
												label={'Type'}
												tooltipText={'Type'}
											/>
										</Form.Label>
										<Select
											options={typeOptions}
											value={defaultType}
											onChange={handleTypeChange}
											isSearchable
										/>
									</Form.Group>
								</Row>
								<Row className='my-3'>
									<Col>
										<Form.Group className="form-fields">
											<Form.Check
												type="checkbox"
												label="Text Updatable"
												name="text_updatable"
												checked={obligationPayload.text_updatable}
												onChange={handleCheckboxChange}
											/>
										</Form.Group>
									</Col>
									<Col>
										<Form.Group className="form-fields">
											<Form.Check
												type="checkbox"
												label="Active"
												name="active"
												checked={obligationPayload.active}
												onChange={handleCheckboxChange}
											/>
										</Form.Group>
									</Col>
								</Row>
								<Row>
									<Col>
										<Form.Group className="form-fields">
											<Form.Label>Comments</Form.Label>
											<Form.Control
												type="text"
												name="comment"
												value={
													obligationPayload.comment
												}
												onChange={handleInputChange}
												placeholder="Enter comment"
											/>
										</Form.Group>
									</Col>
								</Row>
								<div className="ext-fields">
									{(fields ?? []).map(field =>
										renderFormField(field),
									)}
								</div>
							</Col>
							<Col>
								<Form.Group className="form-group-text">
									<Form.Label>
										<ToolTipLabel
											label={'Full Text'}
											tooltipText={'Full Text'}
										/>
									</Form.Label>
									<Form.Control
										className="text-area"
										as="textarea"
										placeholder="Full text"
										name="text"
										value={obligationPayload.text}
										onChange={handleInputChange}
									/>
								</Form.Group>
								{obligationPayload.text && (
									<SimilarityResultList
										list={similarObligations}
										header="Obligation"
										text={obligationPayload.text}
										label={`${obligationPayload.topic} Id:(${obligationPayload.id})`}
									/>
								)}
							</Col>
						</Row>
					</Col>
				</Row>

				<div className="w-100 d-flex justify-content-center">
					<button
						type="submit"
						className="btn btn-success"
						disabled={mutation.isPending}
					>
						{mutation.isPending && (
							<span
								className="spinner-border spinner-border-sm me-1"
								role="status"
							></span>
						)}
						Update Obligation
					</button>
					<button
						type="submit"
						className="btn btn-danger ms-2"
						onClick={() => setObligationPayload(null)}
					>
						Close
					</button>
				</div>
			</Form>
		</div>
	);
}

ObligationDetailForm.propTypes = {
	obligationPayload: PropTypes.shape({
		id: PropTypes.string.isRequired,
		topic: PropTypes.string.isRequired,
		text: PropTypes.string,
		license_ids: PropTypes.arrayOf(PropTypes.string),
		classification: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		category: PropTypes.string.isRequired,
		comment: PropTypes.string,
		external_ref: PropTypes.object,
	}).isRequired,
	setObligationPayload: PropTypes.func.isRequired,
	page: PropTypes.number.isRequired,
	perPage: PropTypes.number.isRequired,
	sortOrder: PropTypes.string.isRequired,
	setRefresh: PropTypes.func.isRequired,
};

export default ObligationDetailForm;
