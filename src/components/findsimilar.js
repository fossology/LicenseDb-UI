import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import "../styles/SimilarityResultList.css"; 

const SimilarityResultList = ({ list = [], header = "Result" }) => {
    if (!list.length) return null;


    return (
        <div style={{ overflow: "hidden", }}>
            <p style={{ fontSize: "16px", marginBottom: "0px" }}>
                Found {list.length} similar {header.toLowerCase()}s:
            </p>
            <div className="p-2 similarity-scroll" style={{ border: "var(--bs-border-width) solid var(--bs-border-color)",borderRadius:"10px"  }}>
                <Row className="g-3 ps-2">
                    {list.map((item, index) => (
                        <Col key={index} md={12}>
                            <Card>
                                <Card.Body>
                                    <Card.Title className="d-flex justify-content-between">
                                        <span>{item.shortname || item.topic || "Unnamed"}</span>
                                        <span className="text-primary">
                                            {(item.similarity * 100)?.toFixed(2)}%
                                        </span>
                                    </Card.Title>
                                    <Card.Text className="truncate-text">
                                        {item.text || "No text available."}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>

    );
};

export default SimilarityResultList;
