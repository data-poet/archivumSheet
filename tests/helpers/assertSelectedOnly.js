function assertSelectedOnly(resultObj, selectedObj) {
  const resultKeys = Object.keys(resultObj);
  const selectedKeys = Object.keys(selectedObj);

  expect(resultKeys.length).toBe(selectedKeys.length);

  resultKeys.forEach((id) => {
    expect(selectedKeys).toContain(id);
  });
}

module.exports = assertSelectedOnly;
