// SPDX-License-Identifier: GPL-2.0-only
// SPDX-FileCopyrightText: © 2024 Siemens AG
// SPDX-FileContributor: Sourav Bhowmik <sourav.bhowmik@siemens.com>

import React, { useEffect, useState } from 'react';
import { ImSearch } from 'react-icons/im';
import { Link } from 'react-router-dom';
import { GoPlusCircle } from 'react-icons/go';
import Button from 'react-bootstrap/Button';
import PropTypes from 'prop-types';

function GlobalSearch({
	onSearch,
	refresh = false,
	createLink = '/license/create',
	createLabel = 'Create License',
	placeholder = 'Search licenses...',
}) {
	const [query, setQuery] = useState('');

	const handleSearch = () => {
		onSearch(query.trim());
	};

	useEffect(() => {
		handleSearch();
	}, [refresh]);

	const handleKeyPress = e => {
		if (e.key === 'Enter') {
			handleSearch();
		}
	};

	return (
		<div className="table-header my-2">
			<Link to={createLink}>
				<Button variant="primary">
					<GoPlusCircle className="me-1 mb-1" />
					{createLabel}
				</Button>
			</Link>
			<div className="search-container">
				<div className="search-icon" onClick={handleSearch}>
					<ImSearch />
				</div>
				<div className="search-input-wrapper">
					<input
						type="text"
						placeholder={placeholder}
						className="search-input"
						value={query}
						onChange={e => setQuery(e.target.value)}
						onKeyDown={handleKeyPress}
					/>
				</div>
			</div>
		</div>
	);
}

GlobalSearch.propTypes = {
	onSearch: PropTypes.func.isRequired,
	refresh: PropTypes.bool,
	createLink: PropTypes.string,
	createLabel: PropTypes.string,
	placeholder: PropTypes.string,
};

export default GlobalSearch;
