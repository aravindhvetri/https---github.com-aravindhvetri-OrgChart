//Default Imports:
import * as React from "react";
import { useState, useEffect } from "react";
//Sytels Imports:
import "../../../External/style.css";
//Prime React Imports:
import { OrganizationChart } from "primereact/organizationchart";
import { TreeNode } from "primereact/treenode";
import SPServices from "../../../CommonService/SPServices";
import { Config } from "../../../CommonService/Config";
import { IPeoplePickerDetails } from "../../../CommonService/interface";
import { Persona, PersonaSize } from "office-ui-fabric-react";

const MainComponent = ({ context }) => {
  const loginUser = context?._pageContext?._user?.email;
  const [orgChartData, setOrgChartData] = useState<TreeNode[]>([]);

  const getEmployeeDetails = () => {
    SPServices.SPReadItems({
      Listname: Config.ListNames.EmployeeList,
      Select:
        "*,Employee/Id,Employee/Title,Employee/EMail,Members/Id,Members/Title,Members/EMail",
      Expand: "Employee,Members",
      Orderby: "Modified",
      Orderbydecorasc: false,
    }).then((res: any) => {
      const tempUsersData = [];
      res.forEach((item: any) => {
        let _Employee: IPeoplePickerDetails[] = [];
        _Employee.push({
          id: item.Employee.Id,
          name: item.Employee.Title,
          email: item.Employee.EMail,
        });
        let _Members: IPeoplePickerDetails[] = [];
        item.Members.forEach((member: any) => {
          _Members.push({
            id: member.Id,
            name: member.Title,
            email: member.EMail,
          });
        });
        tempUsersData.push({
          Employee: _Employee,
          Members: _Members,
        });
      });

      const rootEmployee = tempUsersData.find(
        (user) =>
          user.Employee[0]?.email?.toLowerCase() === loginUser?.toLowerCase()
      );

      if (rootEmployee) {
        const tree = [
          buildTreeFromEmployee(rootEmployee.Employee[0], tempUsersData),
        ];
        setOrgChartData(tree);
      }
    });
  };

  const buildTreeFromEmployee = (
    employee: IPeoplePickerDetails,
    data: any[]
  ): TreeNode => {
    const current = data.find(
      (entry) =>
        entry.Employee[0]?.email?.toLowerCase() ===
        employee.email?.toLowerCase()
    );

    const children: TreeNode[] = [];

    if (current?.Members?.length > 0) {
      current.Members.forEach((member: IPeoplePickerDetails) => {
        const isAlsoManager = data.some(
          (entry) =>
            entry.Employee[0]?.email?.toLowerCase() ===
            member.email?.toLowerCase()
        );

        const imgUrl = `/_layouts/15/userphoto.aspx?size=L&username=${member?.email}`;
        const node: TreeNode = {
          label: member.name,
          data: {
            name: member.name,
            email: member.email,
            imageUrl: imgUrl,
          },
        };

        if (isAlsoManager) {
          children.push(buildTreeFromEmployee(member, data));
        } else {
          children.push(node);
        }
      });
    }

    return {
      label: employee?.name,
      expanded: true,
      data: {
        name: employee.name,
        email: employee.email,
        imageUrl: `/_layouts/15/userphoto.aspx?size=L&username=${employee?.email}`,
      },
      children: children,
    };
  };

  //Template for rendering each node in the org chart:
  const nodeTemplate = (node: TreeNode) => {
    const { name, imageUrl } = node.data || {};
    return (
      <div className="nodeTemplateContainer">
        <img src={imageUrl} alt={name} />
        <span>{name}</span>
      </div>
    );
  };

  //Initial Render:
  useEffect(() => {
    getEmployeeDetails();
  }, []);

  return (
    <div className="card overflow-x-auto">
      <h2 className="OrgHeading">Organization Chart</h2>
      {orgChartData.length > 0 && (
        <OrganizationChart value={orgChartData} nodeTemplate={nodeTemplate} />
      )}
    </div>
  );
};

export default MainComponent;
