import React, { useEffect, useState } from "react";
import { Table, Tag, Input, Select, Spin } from "antd";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const { Option } = Select;
import "./Home.css";

const useQuery = () => new URLSearchParams(useLocation().search);

// Utility function for debouncing (delay between rapid function calls)
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const Home = () => {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const query = useQuery();

  // Extract pagination, tags, and search from the URL
  const initialPage = parseInt(query.get("page")) || 1;
  const initialPageSize = parseInt(query.get("pageSize")) || 10;
  const initialSelectedTags = query.get("tags")
    ? query.get("tags").split(",")
    : [];
  const initialSearchText = query.get("search") || "";

  const [pagination, setPagination] = useState({
    current: initialPage,
    pageSize: initialPageSize,
    total: 100,
  });

  const [selectedTags, setSelectedTags] = useState(initialSelectedTags);
  const [tags, setTags] = useState([]);
  const [searchText, setSearchText] = useState(initialSearchText);

  // Fetch data from the external source (dummy JSON API)
  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await axios.get("https://dummyjson.com/posts?limit=100");
      const posts = response.data.posts;
      const uniqueTags = Array.from(
        new Set(posts.flatMap((post) => post.tags))
      );
      setTags(uniqueTags);
      setAllData(posts);
      applyFilters(
        posts,
        pagination.current,
        pagination.pageSize,
        selectedTags,
        searchText
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters based on tags and search text, and paginate the data
  const applyFilters = (allData, currentPage, pageSize, tags, search) => {
    let filteredData = allData;

    // Filter by tags
    if (tags.length > 0) {
      filteredData = filteredData.filter((post) =>
        post.tags.some((tag) => tags.includes(tag))
      );
    }

    // Filter by search text
    if (search) {
      filteredData = filteredData.filter((post) =>
        post.body.toLowerCase().includes(search.toLowerCase())
      );
    }

    const start = (currentPage - 1) * pageSize;
    const end = currentPage * pageSize;
    setData(filteredData.slice(start, end));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When state changes, update the URL and apply filters
  useEffect(() => {
    applyFilters(
      allData,
      pagination.current,
      pagination.pageSize,
      selectedTags,
      searchText
    );

    navigate(
      `/?page=${pagination.current}&pageSize=${
        pagination.pageSize
      }&tags=${selectedTags.join(",")}&search=${searchText}`
    );
  }, [selectedTags, searchText, pagination.current, pagination.pageSize]); // Apply filters and update URL when state changes

  const debouncedApplyFilters = debounce(applyFilters, 500);

  const onTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setPagination(pagination); // Update pagination state
  };

  const onTagsChange = (value) => {
    setSelectedTags(value);
  };

  const onSearchChange = (e) => {
    const newSearchText = e.target.value;
    setSearchText(newSearchText);
  };

  // Table columns definition
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: "22%",
    },
    {
      title: "Body",
      dataIndex: "body",
      width: "60%",
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      responsive: ["lg"],
      render: (tags) => (
        <>
          {tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
  ];

  // Style for loading spinner
  const loadingStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    width: "100vw",
  };

  return (
    <div>
      {loading ? (
        <div style={loadingStyle}>
          <Spin tip="Loading..." size="large" />
        </div>
      ) : (
        <>
          <div className="nav-wrapper" style={{ margin: "30px 49px" }}>
            <Select
              mode="multiple"
              className="select"
              placeholder="Filter"
              value={selectedTags}
              onChange={onTagsChange}
            >
              {tags.map((tag) => (
                <Option style={{ fontSize: "0.7rem" }} key={tag} value={tag}>
                  {tag}
                </Option>
              ))}
            </Select>

            <Input
              style={{ width: "23%", marginLeft: "16px" }}
              placeholder="Search..."
              value={searchText}
              onChange={onSearchChange}
            />
          </div>

          <Table
            className="table"
            columns={columns}
            dataSource={data}
            pagination={pagination}
            onChange={onTableChange}
          />
        </>
      )}
    </div>
  );
};

export default Home;
