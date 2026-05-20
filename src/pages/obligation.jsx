// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';
import '../styles/obligation.css';
import { FcSearch } from 'react-icons/fc';
import { Link } from 'react-router-dom';
import { GoPlusCircle } from 'react-icons/go';
import { useQuery, keepPreviousData, useQueryClient, useMutation } from '@tanstack/react-query';
import Button from 'react-bootstrap/Button';
import { fetchObligations, updateObligation } from '../api/api';
import ObligationDetailForm from './obligationDetailForm';
import CustomColorCell from '../components/CustomColorCell';
import '../styles/dataTable.css';
import '../styles/globalSearch.css';
import SortableColumnHeader from '../components/SortableColumnHeader';
import { GetTokenSync } from '../contexts/AuthContext.jsx';
import { MdOutlineDelete } from "react-icons/md";
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { toast } from 'react-toastify';

const DEFAULT_PER_PAGE = 10;
const DEFAULT_PAGE = 1;

const TableHeader = () => {
	return (
		<div className="table-header my-2">
			<Link to="/obligation/create">
				<Button variant="primary">
					<GoPlusCircle className="me-1 mb-1" />
					Create Obligation
				</Button>
			</Link>
			<div className="search-container">
				<div className="search-icon">
					<FcSearch />
				</div>
				<input
					type="text"
					placeholder="Search"
					className="search-input"
				/>
			</div>
		</div>
	);
};

function DeletionModal({ obligationToBeDeleted, setObligationToBeDeleted }) {
	const queryClient = useQueryClient();
	const mutation = useMutation({
		mutationFn: updateObligation,
		onError: error => {
			toast.error(
				`Obligation deletion failed: ${error.response.data.error}`,
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
			toast.success('Obligation deleted successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries('obligations');
			queryClient.invalidateQueries('audits');
		},
	});

	return (
		<>
			<Modal
				size="lg"
				show={obligationToBeDeleted !== null}
				onHide={() => setObligationToBeDeleted(null)}
			>
				<Modal.Header
					style={{ backgroundColor: '#feefef', color: '#c7283e' }}
					closeButton
				>
					<Modal.Title className="fw-bold">
						Delete Obligation
					</Modal.Title>
				</Modal.Header>
				<Modal.Body className="fs-5">
					<div className="fw-bold">
						This operation hard deletes the obligation. Please use
						with caution.
					</div>
					{obligationToBeDeleted &&
						obligationToBeDeleted.license_ids.length > 0 && (
							<div
								className="alert alert-danger fw-medium mt-3"
								role="alert"
							>
								Obligation cannot be deleted: Found{' '}
								{obligationToBeDeleted.license_ids.length}{' '}
								associated licenses. Please disassociate them
								first.
							</div>
						)}
				</Modal.Body>
				<Modal.Footer>
					<button
						className="btn btn-secondary"
						onClick={() => setObligationToBeDeleted(null)}
					>
						Close
					</button>
					<button
						className="btn btn-danger"
						onClick={() => {
							console.log(obligationToBeDeleted)
							mutation.mutate({
								obligationPayload: { ...obligationToBeDeleted, active: false },
								id: obligationToBeDeleted.id,
							})
						}}
						disabled={mutation.isPending || (obligationToBeDeleted?.license_ids.length > 0)}
					>
						Delete
					</button>
				</Modal.Footer>``
			</Modal>
		</>
	);
}

DeletionModal.propTypes = {
	obligationToBeDeleted: PropTypes.shape({
		topic: PropTypes.string.isRequired,
		shortnames: PropTypes.arrayOf(PropTypes.string).isRequired,
	}),
	setObligationToBeDeleted: PropTypes.func.isRequired,
};


function Obligation() {
	const [page, setPage] = useState(DEFAULT_PAGE);
	const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
	const [obligationPayload, setObligationPayload] = useState(null);
	const [sortOrder, setSortOrder] = useState('asc');
	const isLoggedIn = GetTokenSync() !== null;
	const [refresh, setRefresh] = useState(false);
	const [deletionObligation, setDeletionObligation] = useState(null);

	const { isPending, isError, error, data, isPreviousData } = useQuery({
		queryKey: ['obligations', page, perPage, sortOrder],
		queryFn: () => fetchObligations({ page, limit: perPage, sortOrder }),
		placeholderData: keepPreviousData,
	});

	const handleColumnClick = sortOrder => {
		setSortOrder(sortOrder);
	};

	const columns = [
		{
			name: 'Type',
			maxWidth: '20%',
			selector: row => row.type,
			wrap: true,
		},
		{
			name: (
				<SortableColumnHeader
					columnName="Obligation/Risk Topic"
					handleColumnClick={handleColumnClick}
					sortOrder={sortOrder}
				/>
			),
			maxWidth: '20%',
			selector: row => row.topic,
			wrap: true,
		},
		{
			name: 'Full Text',
			wrap: true,
			maxWidth: '45%',
			style: {
				textAlign: 'left',
			},
			cell: row => (
				<span className="single-line-preview">
					{row.text?.substr(0, 100) ?? ''}
					{(row.text ?? '').length > 100 && '...'}
				</span>
			),
		},
		{
			name: 'Classification',
			wrap: true,
			maxWidth: '10%',
			cell: row => <CustomColorCell color={row.classification} />,
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
							obligationPayload &&
							row.id === obligationPayload.id
						) {
							setObligationPayload(null);
							return;
						}
						setDeletionObligation(row);
					}}
				/>
			),
		},

	];

	const handlePageChange = page => {
		setPage(page);
	};

	const handleRowsChange = newPerPage => {
		setPerPage(newPerPage);
	};

	const handleRowClicked = row => {
		if (obligationPayload && obligationPayload.id === row.id) {
			setObligationPayload(null);
		} else {
			setObligationPayload(row);
		}
	};

	return (
		<div className="content">
			<DeletionModal
				obligationToBeDeleted={deletionObligation}
				setObligationToBeDeleted={setDeletionObligation}
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
							fixedHeader
							columns={columns}
							data={data.data ?? []}
							progressPending={isPreviousData}
							pagination
							paginationServer
							paginationTotalRows={
								data.paginationmeta.resource_count
							}
							striped
							highlightOnHover
							pointerOnHover
							onChangeRowsPerPage={handleRowsChange}
							subHeader={isLoggedIn}
							onRowClicked={handleRowClicked}
							onChangePage={handlePageChange}
							subHeaderComponent={
								<div className="table-header my-2">
									<Link to="/obligation/create">
										<Button variant="primary">
											<GoPlusCircle className="me-1 mb-1" />
											Create Obligation
										</Button>
									</Link>
								</div>
							}
						/>
					</div>
					{obligationPayload && isLoggedIn && (
						<ObligationDetailForm
							obligationPayload={obligationPayload}
							setObligationPayload={setObligationPayload}
							page={page}
							perPage={perPage}
							sortOrder={sortOrder}
						/>
					)}
				</div>
			)}
		</div>
	);
}

export default Obligation;
