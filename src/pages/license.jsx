// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import { useState, useCallback, useRef, useEffect } from 'react';
import '../styles/license.css';
import DataTable from 'react-data-table-component';
import { useQuery, keepPreviousData, useQueryClient, useMutation } from '@tanstack/react-query';
import LicenseDetailForm from '../components/licenseDetailForm';
import { fetchLicenses, updateLicense } from '../api/api';
import CustomColorCell from '../components/CustomColorCell';
import '../styles/dataTable.css';
import '../styles/globalSearch.css';
import SortableColumnHeader from '../components/SortableColumnHeader';
import { GetTokenSync } from '../contexts/AuthContext.jsx';
import GlobalSearch from '../components/globalSearch';
import { MdOutlineDelete } from "react-icons/md";
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

const DEFAULT_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

function DeletionModal({ licenseToBeDeleted, setLicenseToBeDeleted }) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: updateLicense,
		onError: error => {
			toast.error(
				`License deletion failed: ${error.response.data.error}`,
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
			toast.success('License deleted successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries('licenses');
			queryClient.invalidateQueries('audits');
		},
	});

	return (
		<>
			<Modal
				size="lg"
				show={licenseToBeDeleted !== null}
				onHide={() => setLicenseToBeDeleted(null)}
			>
				<Modal.Header
					style={{ backgroundColor: '#feefef', color: '#c7283e' }}
					closeButton
				>
					<Modal.Title className="fw-bold">
						Delete License
					</Modal.Title>
				</Modal.Header>
				<Modal.Body className="fs-5">
					<div className="fw-bold">
						This operation deletes the license. Please use
						with caution.
					</div>
				</Modal.Body>
				<Modal.Footer>
					<button
						className="btn btn-secondary"
						onClick={() => setLicenseToBeDeleted(null)}
					>
						Close
					</button>
					<button
						className="btn btn-danger"
						onClick={() => {
							mutation.mutate({
								licensePayload: { ...licenseToBeDeleted, active: false },
								id: licenseToBeDeleted.id,
							})
						}}
						disabled={mutation.isPending}
					>
						Delete
					</button>
				</Modal.Footer>
			</Modal>
		</>
	);
}

DeletionModal.propTypes = {
	licenseToBeDeleted: PropTypes.shape({
		id: PropTypes.string.isRequired,
	}),
	setLicenseToBeDeleted: PropTypes.func.isRequired,
};

function License() {
	const riskToColorMapping = new Map([
		[0, 'white'],
		[1, 'aqua'],
		[2, 'green'],
		[3, 'yellow'],
		[4, 'orange'],
		[5, 'red'],
	]);
	const [licensePayload, setLicensePayload] = useState(null);
	const [page, setPage] = useState(DEFAULT_PAGE);
	const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
	const [sortField, setSortField] = useState('spdx_id');
	const [sortOrder, setSortOrder] = useState('asc');
	const isLoggedIn = GetTokenSync() !== null;
	const [tableData, setTableData] = useState([]);
	const [paginationData, setPaginationData] = useState();
	const [isSearchActive, setIsSearchActive] = useState(false);
	const filterRef = useRef(null);
	const [refresh, setRefresh] = useState(false);
	const [deletionLicense, setDeletionLicense] = useState(null);

	const { isPending, isError, error, data, isPreviousData } = useQuery({
		queryKey: ['licenses', page, perPage, sortField, sortOrder],
		queryFn: () =>
			fetchLicenses({ page, limit: perPage, sortField, sortOrder }),
		enabled: !isSearchActive,
		placeholderData: keepPreviousData,
	});

	// Update table data when query data changes
	useEffect(() => {
		if (!isSearchActive && data?.data) {
			filterRef.current = data.data;
			setTableData(data.data);
			setPaginationData(data.paginationmeta.resource_count);
		}
	}, [data, isSearchActive]);

	const handleColumnClick = (sortField, sortOrder) => {
		setSortField(sortField);
		setSortOrder(sortOrder);
	};

	const columns = [
		{
			name: (
				<SortableColumnHeader
					columnName="SPDX Expression"
					columnKey="spdx_id"
					handleColumnClick={handleColumnClick}
					sortField={sortField}
					sortOrder={sortOrder}
				/>
			),
			maxWidth: '20%',
			selector: row => row.spdx_id ?? '',
			sortField: 'spdx_id',
		},
		{
			name: (
				<SortableColumnHeader
					columnName="Short Name"
					columnKey="shortname"
					handleColumnClick={handleColumnClick}
					sortField={sortField}
					sortOrder={sortOrder}
				/>
			),
			maxWidth: '20%',
			selector: row => row.shortname ?? '',
			sortField: 'shortname',
		},
		{
			name: (
				<SortableColumnHeader
					columnName="Full Name"
					columnKey="fullname"
					handleColumnClick={handleColumnClick}
					sortField={sortField}
					sortOrder={sortOrder}
				/>
			),
			maxWidth: '20%',
			selector: row => row.fullname ?? '',
			sortField: 'fullname',
		},
		{
			name: 'Text',
			maxWidth: '30%',
			cell: row => (
				<div className="license-text">
					<span>
						{row.text?.substr(0, 50) ?? ''}
						{(row.text ?? '').length > 50 && '...'}
					</span>
				</div>
			),
		},
		{
			name: 'Risk',
			maxWidth: '10%',
			wrap: true,
			cell: row => (
				<CustomColorCell
					color={riskToColorMapping.get(row.risk)}
					text={row.risk}
				/>
			),
		},
		{
			name: 'Actions',
			maxWidth: '5%',
			cell: row => (
				<MdOutlineDelete
					className="btn-icon"
					size={20}
					onClick={() => {
						if (
							licensePayload &&
							row.id === licensePayload.id
						) {
							setLicensePayload(null);
						}
						setDeletionLicense(row);
					}}
				/>
			),
		},

	];

	const handleRowsChange = newPerPage => {
		setPerPage(newPerPage);
		if (!isSearchActive) {
			setPage(1); // Reset to the first page
		}
	};

	const handleRowClicked = row => {
		if (licensePayload && licensePayload.id === row.id) {
			setLicensePayload(null);
		} else {
			setLicensePayload(row);
		}
	};

	const handlePageChange = page => {
		setPage(page);
	};

	const handleHeaderData = useCallback(searchData => {
		if (searchData?.data) {
			setIsSearchActive(true);
			filterRef.current = searchData.data;
			setTableData(searchData.data);
			setPaginationData(searchData.paginationmeta.resource_count);
		} else {
			resetToDefault();
		}
	}, []);

	const resetToDefault = () => {
		setIsSearchActive(false);
		setPage(1);
	};

	return (
		<div className="content">
			<DeletionModal
				licenseToBeDeleted={deletionLicense}
				setLicenseToBeDeleted={setDeletionLicense}
			/>
			{isPending ? (
				<div
					className="d-flex position-relative"
					style={{ height: '68vh' }}
				>
					<div
						className="z-1 position-absolute top-50 start-50 translate-middle border d-flex justify-content-center align-items-center shadow-sm"
						style={{
							backgroundColor: '#fff',
							height: '55px',
							width: '140px',
						}}
					>
						<div>Loading...</div>
					</div>
				</div>
			) : isError ? (
				<div
					className="d-flex justify-content-center align-items-center"
					style={{ height: '68vh' }}
				>
					<p>Something went wrong: {error.message}</p>
				</div>
			) : (
				<div>
					<div className="my-3 shadow-sm border position-relative">
						<DataTable
							paginationDefaultPage={page}
							fixedHeader
							columns={columns}
							data={tableData}
							progressPending={isPreviousData}
							pagination
							paginationServer={!isSearchActive}
							paginationTotalRows={paginationData}
							striped
							highlightOnHover
							pointerOnHover
							onChangeRowsPerPage={handleRowsChange}
							subHeader={isLoggedIn}
							onRowClicked={handleRowClicked}
							onChangePage={handlePageChange}
							subHeaderComponent={
								<GlobalSearch
									response={handleHeaderData}
									refresh={refresh}
								/>
							}
						/>
					</div>
					{licensePayload && isLoggedIn && (
						<LicenseDetailForm
							licensePayload={licensePayload}
							setLicensePayload={setLicensePayload}
							page={page}
							perPage={perPage}
							sortField={sortField}
							sortOrder={sortOrder}
							setRefresh={setRefresh}
						/>
					)}
				</div>
			)}
		</div>
	);
}

export default License;
