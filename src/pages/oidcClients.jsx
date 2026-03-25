// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2025 Siemens AG
// SPDX-FileContributor: Dearsh Oberoi <dearsh.oberoi@siemens.com>

import { useState } from 'react';
import {
	Container,
	Row,
	Col,
	Table,
	Button,
	Spinner,
	Alert,
	Modal,
	Form,
} from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { fetchOidcClients, deleteOidcClient, postOidcClient } from '../api/api';
import { MdDelete } from 'react-icons/md';
import DataTable from 'react-data-table-component';

function AddClientModal({ show, setShow }) {
	const handleAddClientChange = e => {
		const { name, value } = e.target;
		setNewClientData(prev => ({ ...prev, [name]: value }));
	};

	const [newClientData, setNewClientData] = useState({
		clientId: '',
	});

	const handleAddClientSubmit = e => {
		e.preventDefault();
		addMutation.mutate(newClientData);
	};

	const queryClient = useQueryClient();

	const addMutation = useMutation({
		mutationFn: postOidcClient,
		onSuccess: () => {
			toast.success('OIDC Client added successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['oidcClients']);
			setShow(false);
			setNewClientData({ clientId: '' });
		},
		onError: err => {
			toast.error(
				`Failed to add OIDC Client: ${err.response.data.error}`,
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
	});

	return (
		<Modal show={show} onHide={() => setShow(false)} size="md" centered>
			<Modal.Header closeButton>
				<Modal.Title>Add New OIDC Client</Modal.Title>
			</Modal.Header>
			<Form onSubmit={handleAddClientSubmit}>
				<Modal.Body>
					<Form.Group className="mb-3" controlId="formClientId">
						<Form.Label>Client ID</Form.Label>
						<Form.Control
							type="text"
							placeholder="Enter client ID"
							name="clientId"
							value={newClientData.clientId}
							onChange={handleAddClientChange}
							required
						/>
					</Form.Group>
				</Modal.Body>
				<Modal.Footer>
					<Button
						variant="outline-danger"
						onClick={() => setShow(false)}
					>
						Cancel
					</Button>
					<Button
						variant="outline-success"
						type="submit"
						disabled={addMutation.isPending}
					>
						{addMutation.isPending ? (
							<Spinner
								as="span"
								animation="border"
								size="sm"
								role="status"
								aria-hidden="true"
								className="me-1"
							/>
						) : (
							''
						)}
						Add Client
					</Button>
				</Modal.Footer>
			</Form>
		</Modal>
	);
}

function DeleteClientModal({
	show,
	setShow,
	clientToDelete,
	setClientToDelete,
}) {
	const deleteMutation = useMutation({
		mutationFn: deleteOidcClient,
		onSuccess: () => {
			toast.success('OIDC Client deleted successfully!', {
				position: 'top-right',
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: 'dark',
			});
			queryClient.invalidateQueries(['oidcClients']);
			setShow(false);
			setClientToDelete(null);
		},
		onError: err => {
			toast.error(
				`Failed to delete OIDC Client: ${err.response.data.error}`,
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
			setShow(false);
			setClientToDelete(null);
		},
	});

	const confirmDelete = () => {
		if (clientToDelete) {
			deleteMutation.mutate({ clientId: clientToDelete.clientId });
		}
	};

	const queryClient = useQueryClient();

	return (
		<Modal show={show} onHide={() => setShow(false)} size="md" centered>
			<Modal.Header closeButton>
				<Modal.Title>Confirm Deletion</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				Are you sure you want to delete the OIDC client{' '}
				<strong>{clientToDelete?.clientName}</strong> (ID:{' '}
				{clientToDelete?.clientId})?
			</Modal.Body>
			<Modal.Footer>
				<Button
					variant="outline-secondary"
					onClick={() => setShow(false)}
				>
					Cancel
				</Button>
				<Button
					variant="outline-danger"
					onClick={confirmDelete}
					disabled={deleteMutation.isPending}
				>
					{deleteMutation.isPending ? (
						<Spinner
							as="span"
							animation="border"
							size="sm"
							role="status"
							aria-hidden="true"
							className="me-1"
						/>
					) : (
						''
					)}
					Delete
				</Button>
			</Modal.Footer>
		</Modal>
	);
}

function convertUtcToLocal(utcString) {
	const utcDate = new Date(utcString);

	const options = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZoneName: 'short',
	};
	const formattedLocalDateTime = utcDate.toLocaleString(undefined, options);

	return formattedLocalDateTime;
}

function OidcClientManager() {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [clientToDelete, setClientToDelete] = useState(null);
	const [showAddClientModal, setShowAddClientModal] = useState(false);

	const handleDeleteClick = client => {
		setClientToDelete(client);
		setShowDeleteConfirm(true);
	};

	const columns = [
		{
			name: 'Client Id',
			maxWidth: '50%',
			cell: row => <>{row.client_id}</>,
		},
		{
			name: 'Add Date',
			maxWidth: '40%',
			cell: row => <>{row.add_date && convertUtcToLocal(row.add_date)}</>,
		},
		{
			name: 'Delete',
			maxWidth: '10%',
			cell: row => (
				<MdDelete
					size={20}
					onClick={() =>
						handleDeleteClick({ clientId: row.client_id })
					}
				/>
			),
		},
	];

	const {
		data: oidcClients,
		isLoading,
		isError,
		error,
		isPreviousData,
	} = useQuery({
		queryKey: ['oidcClients'],
		queryFn: fetchOidcClients,
	});

	if (isLoading) {
		return (
			<Container className="mt-4 text-center">
				<Spinner animation="border" role="status">
					<span className="visually-hidden">
						Loading OIDC Clients...
					</span>
				</Spinner>
				<p>Loading OIDC Clients...</p>
			</Container>
		);
	}

	if (isError) {
		return (
			<Container className="mt-4">
				<Alert variant="danger">
					<Alert.Heading>Oh snap! You got an error!</Alert.Heading>
					<p>Error fetching OIDC Clients: {error.message}</p>
				</Alert>
			</Container>
		);
	}

	return (
		<Container className="mt-4">
			<AddClientModal
				show={showAddClientModal}
				setShow={setShowAddClientModal}
			/>
			<DeleteClientModal
				show={showDeleteConfirm}
				setShow={setShowDeleteConfirm}
				clientToDelete={clientToDelete}
				setClientToDelete={setClientToDelete}
			/>
			<h5 className="header-title">Manage Clients</h5>
			<div className="my-3 shadow-sm border position-relative">
				<DataTable
					fixedHeader
					columns={columns}
					data={oidcClients.data}
					progressPending={isPreviousData}
					striped
					highlightOnHover
					pointerOnHover
				/>
			</div>
			<Row>
				<Col lg={2}>
					<Button
						variant="outline-success"
						type="submit"
						onClick={() => setShowAddClientModal(true)}
					>
						Add Client
					</Button>
				</Col>
			</Row>
		</Container>
	);
}

export default OidcClientManager;
