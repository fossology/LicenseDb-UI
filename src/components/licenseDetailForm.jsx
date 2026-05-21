// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import React, { useState, useEffect } from 'react';
import {
	Row,
	Col,
	Form,
	InputGroup,
	OverlayTrigger,
	Tooltip,
} from 'react-bootstrap';
import '../styles/detailViewForm.css';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import Select from 'react-select';
import { TbListDetails } from 'react-icons/tb';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';
import { BsClipboard } from 'react-icons/bs';
import CustomSelect from '../components/customStyleSelect';
import { riskOptions } from '../utils/data/dropdownOptions';
import ToolTipLegend from './tooltip/tooltipLegend';
import ToolTipLabel from './tooltip/tooltipLabel';
import { tooltipLicense } from './tooltip/tooltips';
import SimilarityResultList from '../components/SimilarityResultList';
import {
	fetchObligationPreviews,
	updateLicense,
	fetchSimilarLicenses,
} from '../api/api';
import 'react-toastify/dist/ReactToastify.css';
import { loadYaml } from '../utils/loadYaml';
import { resolveComponentPath } from '../utils/componentPathMap';

function LicenseDetailForm({
	licensePayload,
	setLicensePayload,
	page,
	perPage,
	sortField,
	sortOrder,
	setRefresh,
}) {
	const [showModal, setShowModal] = useState(false);
	const queryClient = useQueryClient();
	const [fields, setFields] = useState([]);
	const [similarLicenses, setSimilarLicenses] = useState([]);

	useEffect(() => {
		const fetchConfig = async () => {
			const config = await loadYaml(
				`${import.meta.env.VITE_DOMAIN_SUBDIRECTORY ? `/${import.meta.env.VITE_DOMAIN_SUBDIRECTORY}` : ''}/externalRef.yaml`,
			);
			setFields(config.license.fields);
		};

		fetchConfig();
	}, []);

	const {
		isPending: isObligationsPreviewQueryPending,
		isError: isObligationListFetchError,
		error: obligationListFetchError,
		data: allObligationData,
	} = useQuery({
		queryKey: ['obligations', 'preview'],
		queryFn: () => fetchObligationPreviews(),
	});

	useEffect(() => {
		const delayDebounce = setTimeout(() => {
			if (licensePayload.text) {
				fetchSimilarLicenses(licensePayload.text)
					.then(res => {
						let filtered = res.data || [];
						filtered = filtered.filter(
							item => item.id !== licensePayload.id,
						);
						setSimilarLicenses(filtered);
					})
					.catch(() => {
						setSimilarLicenses([]);
					});
			} else {
				setSimilarLicenses([]);
			}
		}, 500); // debounce time

		return () => clearTimeout(delayDebounce);
	}, [licensePayload.text, licensePayload.id]);

	if (isObligationListFetchError) {
		toast.error(
			`Unable to fetch list of obligations: ${obligationListFetchError.message}`,
			{
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'light',
			},
		);
	}

	const updateLicenseMutation = useMutation({
		mutationFn: updateLicense,
		onError: err => {
			toast.error(`License update failed: ${err.response.data.error}`, {
				position: 'top-right',
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'light',
			});
		},
		onSuccess: data => {
			if (data.status === 200) {
				toast.success('License updated successfully!', {
					position: 'top-right',
					autoClose: 3000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: 'dark',
				});
				setRefresh(prev  => !prev);
				queryClient.invalidateQueries('audits');
			}
		},
	});

	const handleInputChange = e => {
		const { name, value } = e.target;
		setLicensePayload({
			...licensePayload,
			[name]: value,
		});
	};

	const handleChangeExt = e => {
		if (e && e.target) {
			const { name, value, type, checked } = e.target;
			const fieldValue = type === 'checkbox' ? checked : value;
			setLicensePayload(prevData => ({
				...prevData,
				external_ref: {
					...prevData.external_ref,
					[name]: fieldValue,
				},
			}));
		} else {
			const { name, value } = e.target;
			setLicensePayload(prevData => ({
				...prevData,
				external_ref: {
					...prevData.external_ref,
					[name]: value,
				},
			}));
		}
	};

	const handleCheckboxChange = e => {
		const { name, checked } = e.target;
		setLicensePayload({
			...licensePayload,
			[name]: checked,
		});
	};

	const renderFormField = field => {
		const { formComponentPath, name, componentType, label } = field;
		const Component = resolveComponentPath(formComponentPath);

		// Determine the props to pass to the component based on its type
		const componentProps = {
			label,
			name,
			value: licensePayload.external_ref[name],
			onChange: handleChangeExt,
		};
		// Add the "checked" prop conditionally for checkboxes
		if (componentType === 'checkbox') {
			componentProps.checked = !!licensePayload.external_ref[name];
		} else {
			// Ensure value is not undefined, fallback to empty string for normal inputs
			componentProps.value =
				licensePayload.external_ref[name] !== undefined
					? licensePayload.external_ref[name]
					: '';
		}
		return (
			<Row key={name}>
				<Col>
					<Form.Group
						className={`form-fields form-group-${componentType}`}
					>
						<React.Suspense fallback={<div>Loading...</div>}>
							{componentType === 'checkbox' ? (
								<div className="form-check">
									<input
										type="checkbox"
										id={name}
										{...componentProps} // Add props explicitly
										className="form-check-input" // Bootstrap class for checkboxes
									/>
									<label
										htmlFor={name}
										className="form-check-label"
									>
										{label}
									</label>
								</div>
							) : (
								<Component {...componentProps} />
							)}
						</React.Suspense>
					</Form.Group>
				</Col>
			</Row>
		);
	};

	return (
		<div className="detail-form-parent mb-5 shadow-sm">
			<Form className="license-form">
				<Row>
					<Col>
						<Row>
							<Form.Group className="form-group-text">
								<Form.Label>
									<ToolTipLabel
										label={'Id'}
										tooltipText={'Id'}
									/>
								</Form.Label>
								<InputGroup>
									<Form.Control
										type="text"
										placeholder="Id"
										name="id"
										value={licensePayload.id}
										readOnly
										disabled
									/>
									<OverlayTrigger
										overlay={<Tooltip>{'Copy'}</Tooltip>}
									>
										<InputGroup.Text
											onClick={() => {
												navigator.clipboard.writeText(
													licensePayload.id,
												);
											}}
										>
											<BsClipboard />
										</InputGroup.Text>
									</OverlayTrigger>
								</InputGroup>
							</Form.Group>
							<Form.Group className="form-group-text">
								<Form.Label>
									<ToolTipLabel
										label={'Short Name'}
										tooltipText={'Short Name'}
									/>
								</Form.Label>
								<Form.Control
									type="text"
									placeholder="Short Name"
									name="shortname"
									value={licensePayload.shortname}
									onChange={handleInputChange}
								/>
							</Form.Group>
						</Row>
						<Row>
							<Form.Group className="form-group-text">
								<Form.Label>
									<ToolTipLabel
										label={'Full Name'}
										tooltipText={'Full Name'}
									/>
								</Form.Label>
								<Form.Control
									type="text"
									placeholder="Full Name"
									name="fullname"
									value={licensePayload.fullname}
									onChange={handleInputChange}
								/>
							</Form.Group>
						</Row>
						<Row>
							<Col>
								<Form.Group className="form-group-text">
									<Form.Label>
										<ToolTipLabel
											label={'SPDX Expression'}
											tooltipText={'SPDX Expression'}
										/>
									</Form.Label>
									<Form.Control
										type="text"
										placeholder="SPDX Expression"
										name="spdx_id"
										value={licensePayload.spdx_id}
										onChange={handleInputChange}
									/>
								</Form.Group>
							</Col>
							<Col>
								<Form.Group className="form-group-text">
									<Form.Label>
										<ToolTipLegend
											tooltip={tooltipLicense}
											label={'Risk'}
										/>
									</Form.Label>
									<CustomSelect
										selectedValue={
											riskOptions.filter(
												x =>
													x.value ===
													licensePayload.risk,
											)[0]
										}
										name={'risk'}
										options={riskOptions}
										payload={licensePayload}
										setPayload={setLicensePayload}
									/>
								</Form.Group>
							</Col>
						</Row>
						<Row>
							<Col>
								<div className="form-check-inline my-1">
									<input
										className="form-check-input me-1 mt-2"
										type="checkbox"
										name="active"
										checked={licensePayload.active}
										onChange={handleCheckboxChange}
										id="licenseUpdate.active"
									/>
									<label
										className="form-check-label"
										htmlFor="licenseUpdate.active"
									>
										<ToolTipLabel
											tooltipText={
												'This should be checked to make the license active'
											}
											label={'Active'}
										/>
									</label>
								</div>
							</Col>
							<Col>
								<div className="form-check-inline my-1">
									<input
										className="form-check-input me-1 mt-2"
										type="checkbox"
										name="copyleft"
										checked={licensePayload.copyleft}
										onChange={handleCheckboxChange}
										id="licenseUpdate.copyLeft"
									/>
									<label
										className="form-check-label"
										htmlFor="licenseUpdate.copyLeft"
									>
										<ToolTipLabel
											tooltipText={
												'This should be checked to enable copy left'
											}
											label={'Copy Left'}
										/>
									</label>
								</div>
							</Col>
							<Col>
								<div className="form-check-inline my-1">
									<input
										className="form-check-input me-1 mt-2"
										type="checkbox"
										name="OSIapproved"
										checked={licensePayload.OSIapproved}
										onChange={handleCheckboxChange}
										id="licenseUpdate.osiApproved"
									/>
									<label
										className="form-check-label"
										htmlFor="licenseUpdate.osiApproved"
									>
										<ToolTipLabel
											tooltipText={
												'This should be checked to make the license OSI approved'
											}
											label={'OSI Aprroved'}
										/>
									</label>
								</div>
							</Col>
							<Col>
								<div className="form-check-inline my-1">
									<input
										className="form-check-input me-1 mt-2"
										type="checkbox"
										name="text_updatable"
										checked={licensePayload.text_updatable}
										onChange={handleCheckboxChange}
										id="licenseUpdate.textUpdatable"
									/>
									<label
										className="form-check-label"
										htmlFor="licenseUpdate.textUpdatable"
									>
										<ToolTipLabel
											tooltipText={
												'This should be checked to make the license text updatable'
											}
											label={'Text Updatable'}
										/>
									</label>
								</div>
							</Col>
						</Row>
						<Row>
							<Form.Group className="form-group-text">
								<Form.Label className="obligation-overviews">
									<ToolTipLabel
										label={'Obligations'}
										tooltipText={'Obligations Type'}
									/>
									<a
										className="obli-overview"
										onClick={e => {
											e.preventDefault();
											setShowModal(!showModal);
										}}
									>
										{' '}
										<span>
											<TbListDetails />
										</span>{' '}
										Overviews
									</a>
								</Form.Label>
								{!isObligationsPreviewQueryPending && (
									<Select
										options={(
											allObligationData?.data ?? []
										).map(d => ({
											value: d.id,
											label: `${d.type}: ${d.topic} (Id: ${d.id})`,
										}))}
										value={(
											licensePayload?.obligation_ids ?? []
										).filter(id => (allObligationData?.data ?? []).map(o => o.id).includes(id)).map(id => {
											const obl = allObligationData.data.filter(ob => ob.id === id);
											return {
												value: obl[0].id,
												label: `${obl[0].type}: ${obl[0].topic} (Id: ${obl[0].id})`,
											};
										})}
										onChange={selectedObligations => {
											setLicensePayload({
												...licensePayload,
												obligation_ids: [
													...selectedObligations.map(
														ob => ob.value,
													),
													...licensePayload.obligation_ids.filter(id => !(allObligationData?.data ?? []).map(l => l.id).includes(id))
												]
											});
										}}
										isSearchable
										closeMenuOnSelect={false}
										isMulti
										cacheOptions={false}
									/>
								)}
							</Form.Group>
						</Row>

						{/* Dynamically render fields */}
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
									label={'License Text'}
									tooltipText={'License Text'}
								/>
							</Form.Label>
							<Form.Control
								className="text-area"
								as="textarea"
								rows={5}
								placeholder="Enter text"
								name="text"
								value={licensePayload.text}
								onChange={handleInputChange}
							/>
						</Form.Group>
						{licensePayload.text && (
							<SimilarityResultList
								list={similarLicenses}
								header="License"
								text={licensePayload.text}
								label={`${licensePayload.shortname} (Id: ${licensePayload.id})`}
							/>
						)}
					</Col>
				</Row>

				<div className="w-100 d-flex justify-content-center">
					<button
						type="button"
						className="btn btn-primary"
						disabled={updateLicenseMutation.isPending}
						onClick={e => {
							updateLicenseMutation.mutate({
								licensePayload,
								id: licensePayload.id,
							});
						}}
					>
						{updateLicenseMutation.isPending && (
							<span
								className="spinner-border spinner-border-sm me-1"
								role="status"
							></span>
						)}
						Update License
					</button>
				</div>
			</Form>
		</div>
	);
}

LicenseDetailForm.propTypes = {
	licensePayload: PropTypes.shape({
		id: PropTypes.string.isRequired,
		shortname: PropTypes.string,
		fullname: PropTypes.string,
		spdx_id: PropTypes.string,
		risk: PropTypes.number,
		active: PropTypes.bool,
		copyleft: PropTypes.bool,
		OSIapproved: PropTypes.bool,
		text_updatable: PropTypes.bool,
		external_ref: PropTypes.object,
		text: PropTypes.string,
		obligation_ids: PropTypes.arrayOf(PropTypes.string),
	}).isRequired,
	setLicensePayload: PropTypes.func.isRequired,
	page: PropTypes.number.isRequired,
	perPage: PropTypes.number.isRequired,
	sortField: PropTypes.string.isRequired,
	sortOrder: PropTypes.string.isRequired,
	setRefresh: PropTypes.func.isRequired,
};

export default LicenseDetailForm;
